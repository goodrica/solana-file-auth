import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvolvementRequest {
  name: string;
  email: string;
  reason: string;
  timestamp: string;
  honeypot?: string; // for spam protection
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    const body: InvolvementRequest = await req.json();
    const { name, email, reason, timestamp, honeypot } = body;

    // Basic spam protection - honeypot field should be empty
    if (honeypot && honeypot.trim() !== "") {
      console.log("Spam detected: honeypot field filled");
      return new Response(JSON.stringify({ error: "Invalid submission" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Validate required fields
    if (!name || !email || !reason) {
      return new Response(JSON.stringify({ error: "All fields are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({ error: "Invalid email address" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Send email to andrew@filmauthtoken.com
    const emailResponse = await resend.emails.send({
      from: "FilmAuth Development <noreply@filmauthtoken.com>",
      to: ["andrew@filmauthtoken.com"],
      subject: `New Development Interest: ${name}`,
      html: `
        <h2>New Development Interest Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Reason for Interest:</strong></p>
        <blockquote>${reason}</blockquote>
        <p><strong>Submitted:</strong> ${new Date(timestamp).toLocaleString()}</p>
        <hr>
        <p><em>This message was sent from the FilmAuth website development interest form.</em></p>
      `,
    });

    // Send confirmation email to submitter
    await resend.emails.send({
      from: "FilmAuth Team <noreply@filmauthtoken.com>",
      to: [email],
      subject: "Thank you for your interest in FilmAuth development!",
      html: `
        <h2>Thank you for your interest, ${name}!</h2>
        <p>We've received your message about wanting to get involved in FilmAuth development:</p>
        <blockquote>${reason}</blockquote>
        <p>Andrew will review your submission and get back to you soon.</p>
        <p>Best regards,<br>The FilmAuth Team</p>
      `,
    });

    console.log("Involvement email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Your interest has been submitted successfully!" 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-involvement-email function:", error);
    return new Response(
      JSON.stringify({ error: "Failed to send email. Please try again later." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
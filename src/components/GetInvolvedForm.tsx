import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Send } from "lucide-react";

const GetInvolvedForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    reason: '',
    honeypot: '' // Hidden field for spam protection
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.email.trim() || !formData.reason.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Basic client-side email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('send-involvement-email', {
        body: {
          name: formData.name.trim(),
          email: formData.email.trim(),
          reason: formData.reason.trim(),
          timestamp: new Date().toISOString(),
          honeypot: formData.honeypot
        },
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Success!",
        description: "Thank you for your interest! Andrew will get back to you soon.",
      });

      // Reset form
      setFormData({
        name: '',
        email: '',
        reason: '',
        honeypot: ''
      });

    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: "Error",
        description: "Failed to submit your interest. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          name="name"
          type="text"
          value={formData.name}
          onChange={handleInputChange}
          placeholder="Your full name"
          required
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleInputChange}
          placeholder="your.email@example.com"
          required
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="reason">Why do you want to get involved? *</Label>
        <Textarea
          id="reason"
          name="reason"
          value={formData.reason}
          onChange={handleInputChange}
          placeholder="Tell us about your background, skills, and what interests you about FilmAuth development..."
          className="min-h-[120px]"
          required
          disabled={isSubmitting}
        />
      </div>

      {/* Hidden honeypot field for spam protection */}
      <div style={{ display: 'none' }}>
        <Input
          name="honeypot"
          value={formData.honeypot}
          onChange={handleInputChange}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <Button 
        type="submit" 
        disabled={isSubmitting}
        className="w-full"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Submitting...
          </>
        ) : (
          <>
            <Send className="mr-2 h-4 w-4" />
            Submit Interest
          </>
        )}
      </Button>
    </form>
  );
};

export default GetInvolvedForm;
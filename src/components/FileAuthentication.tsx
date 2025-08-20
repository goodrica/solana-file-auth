import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, Hash, Loader2, CheckCircle, AlertCircle, LogIn, ShoppingCart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";
import CreditsDisplay from "./CreditsDisplay";

interface FileInfo {
  name: string;
  size: number;
  type: string;
  hash?: string;
  authenticationId?: string;
  timestamp?: string;
}

const FileAuthentication = () => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<FileInfo | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'hashing' | 'uploading' | 'success' | 'error' | 'insufficient_credits'>('idle');
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [creditsRemaining, setCreditsRemaining] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const calculateFileHash = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await processFile(files[0]);
    }
  }, []);

  const handleFileInput = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await processFile(files[0]);
    }
  }, []);

  const processFile = async (selectedFile: File) => {
    setProcessing(true);
    setStatus('hashing');
    setProgress(0);

    try {
      // Set file info
      const fileInfo: FileInfo = {
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type
      };
      setFile(fileInfo);

      // Progress during hashing
      setProgress(20);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Calculate hash
      const hash = await calculateFileHash(selectedFile);
      setFile(prev => prev ? { ...prev, hash } : null);
      setProgress(50);

      // Submit to blockchain via Supabase edge function
      setStatus('uploading');
      setProgress(70);

      const { data, error } = await supabase.functions.invoke('solana-file-auth', {
        body: {
          action: 'authenticate',
          fileHash: hash,
          fileName: selectedFile.name,
          fileSize: selectedFile.size
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to authenticate file');
      }

      if (!data.success) {
        if (data.error === 'insufficient_credits') {
          setStatus('insufficient_credits');
          toast({
            title: "Insufficient Credits",
            description: "You need FOT tokens to authenticate more photos. Purchase tokens to continue.",
            variant: "destructive",
          });
          return;
        }
        throw new Error(data.error || 'Authentication failed');
      }

      setProgress(100);
      setFile(prev => prev ? { 
        ...prev, 
        authenticationId: data.data.id,
        timestamp: data.data.timestamp 
      } : null);

      setStatus('success');
      setCreditsRemaining(data.creditsRemaining || 0);
      toast({
        title: "Photo authenticated successfully!",
        description: `Your photo hash has been recorded on the Solana blockchain. Credits remaining: ${data.creditsRemaining || 0}`,
      });

    } catch (error: any) {
      console.error('Authentication error:', error);
      setStatus('error');
      toast({
        title: "Authentication failed",
        description: error.message || "There was an error processing your file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <section id="authenticate" className="py-24 bg-muted/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Authenticate Your Photos
            </h2>
            <p className="text-xl text-muted-foreground">
              Upload a photo to create an immutable blockchain record of its authenticity and fight deepfakes
            </p>
          </div>

          <Card className="shadow-card bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" />
                File Upload
              </CardTitle>
              <CardDescription>
                Select or drag a file to generate its cryptographic hash and record it on the blockchain
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {authLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading...</span>
                </div>
              ) : !session ? (
                <div className="text-center py-8">
                  <LogIn className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Authentication Required</h3>
                  <p className="text-muted-foreground mb-4">
                    Please sign in to authenticate your files on the blockchain
                  </p>
                  <Button onClick={() => window.location.href = '/auth'}>
                    Sign In
                  </Button>
                </div>
              ) : (
                <>
              {/* Credits Display */}
              <CreditsDisplay 
                session={session} 
                onCreditsUpdate={(credits) => {
                  setCreditsRemaining(credits.free_credits_remaining + credits.purchased_credits);
                }}
              />

              {/* Upload Area */}
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
                  dragActive 
                    ? 'border-primary bg-primary/5 shadow-glow' 
                    : 'border-muted-foreground/25 hover:border-primary/50'
                }`}
                onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
              >
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Drop your photo here</h3>
                <p className="text-muted-foreground mb-4">or click to browse (uses 1 credit)</p>
                <input
                  type="file"
                  onChange={handleFileInput}
                  className="hidden"
                  id="file-upload"
                  disabled={processing}
                />
                <Button 
                  variant="outline" 
                  asChild 
                  disabled={processing || creditsRemaining <= 0}
                  className="cursor-pointer"
                >
                  <label htmlFor="file-upload">
                    {creditsRemaining <= 0 ? 'No Credits Remaining' : 'Select Photo'}
                  </label>
                </Button>
                {creditsRemaining <= 0 && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled
                    className="mt-2"
                  >
                    <ShoppingCart className="h-3 w-3 mr-1" />
                    Buy FOT Tokens (Coming Soon)
                  </Button>
                )}
              </div>

              {/* File Info */}
              {file && (
                <Card className="bg-muted/30 border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="h-8 w-8 text-primary" />
                        <div>
                          <h4 className="font-medium">{file.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {formatFileSize(file.size)} • {file.type || 'Unknown type'}
                          </p>
                        </div>
                      </div>
                      <Badge 
                        variant={status === 'success' ? 'default' : status === 'error' ? 'destructive' : 'secondary'}
                        className="ml-2"
                      >
                        {status === 'idle' && 'Ready'}
                        {status === 'hashing' && 'Hashing'}
                        {status === 'uploading' && 'Recording'}
                        {status === 'success' && 'Authenticated'}
                        {status === 'error' && 'Failed'}
                        {status === 'insufficient_credits' && 'Need Credits'}
                      </Badge>
                    </div>

                    {/* Hash Display */}
                    {file.hash && (
                      <div className="mt-4 p-3 bg-card rounded-lg border">
                        <div className="flex items-center gap-2 mb-2">
                          <Hash className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium">SHA-256 Hash</span>
                        </div>
                        <code className="text-xs text-muted-foreground font-mono break-all">
                          {file.hash}
                        </code>
                        
                        {/* Authentication Details */}
                        {file.authenticationId && (
                          <div className="mt-3 pt-3 border-t border-border/50">
                            <div className="text-xs text-muted-foreground space-y-1">
                              <div>ID: {file.authenticationId}</div>
                              {file.timestamp && (
                                <div>Authenticated: {new Date(file.timestamp).toLocaleString()}</div>
                              )}
                              <div>Network: Solana</div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Progress */}
              {processing && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {status === 'hashing' ? 'Calculating file hash...' : 'Recording on blockchain...'}
                    </span>
                    <span className="text-sm text-muted-foreground">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}

              {/* Status Messages */}
              {status === 'success' && (
                <div className="flex items-center gap-2 p-4 bg-success/10 border border-success/20 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <div>
                    <p className="text-sm font-medium text-success">Authentication Complete</p>
                    <p className="text-xs text-muted-foreground">Your photo has been recorded on the Solana blockchain. Credits remaining: {creditsRemaining}</p>
                  </div>
                </div>
              )}

              {status === 'error' && (
                <div className="flex items-center gap-2 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  <div>
                    <p className="text-sm font-medium text-destructive">Authentication Failed</p>
                    <p className="text-xs text-muted-foreground">Please try again or contact support</p>
                  </div>
                </div>
              )}

              {status === 'insufficient_credits' && (
                <div className="flex items-center gap-2 p-4 bg-warning/10 border border-warning/20 rounded-lg">
                  <ShoppingCart className="h-5 w-5 text-warning" />
                  <div>
                    <p className="text-sm font-medium text-warning">Insufficient Credits</p>
                    <p className="text-xs text-muted-foreground">Purchase FOT tokens to continue authenticating photos (~$0.03 each)</p>
                  </div>
                </div>
              )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default FileAuthentication;
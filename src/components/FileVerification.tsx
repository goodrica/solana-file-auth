import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, FileText, Hash, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VerificationResult {
  status: 'verified' | 'not-found' | 'error';
  timestamp?: string;
  blockchainRecord?: string;
}

const FileVerification = () => {
  const [file, setFile] = useState<File | null>(null);
  const [hashInput, setHashInput] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const { toast } = useToast();

  const calculateFileHash = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const verifyHash = async (hash: string) => {
    setVerifying(true);
    
    try {
      // Simulate blockchain verification
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock verification result
      const isVerified = Math.random() > 0.3; // 70% chance of being verified
      
      if (isVerified) {
        setResult({
          status: 'verified',
          timestamp: new Date().toISOString(),
          blockchainRecord: `solana:${hash.substring(0, 16)}...`
        });
        toast({
          title: "File verified successfully!",
          description: "This file has been authenticated on the blockchain.",
        });
      } else {
        setResult({
          status: 'not-found'
        });
        toast({
          title: "File not found",
          description: "No blockchain record found for this file hash.",
          variant: "destructive",
        });
      }
    } catch (error) {
      setResult({
        status: 'error'
      });
      toast({
        title: "Verification failed",
        description: "There was an error verifying the file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleFileVerification = useCallback(async (selectedFile: File) => {
    setFile(selectedFile);
    const hash = await calculateFileHash(selectedFile);
    setHashInput(hash);
    await verifyHash(hash);
  }, []);

  const handleHashVerification = useCallback(async () => {
    if (!hashInput.trim()) {
      toast({
        title: "Invalid input",
        description: "Please enter a valid SHA-256 hash.",
        variant: "destructive",
      });
      return;
    }
    await verifyHash(hashInput.trim());
  }, [hashInput]);

  return (
    <section id="verify" className="py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Verify File Authenticity
            </h2>
            <p className="text-xl text-muted-foreground">
              Check if a file has been authenticated on the blockchain
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* File Upload Verification */}
            <Card className="shadow-card bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Upload File to Verify
                </CardTitle>
                <CardDescription>
                  Upload a file to automatically calculate its hash and verify against blockchain records
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                  <FileText className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-3">Drop file here or click to browse</p>
                  <input
                    type="file"
                    onChange={(e) => {
                      const files = e.target.files;
                      if (files && files.length > 0) {
                        handleFileVerification(files[0]);
                      }
                    }}
                    className="hidden"
                    id="verify-file-upload"
                    disabled={verifying}
                  />
                  <Button 
                    variant="outline" 
                    asChild 
                    disabled={verifying}
                    className="cursor-pointer"
                  >
                    <label htmlFor="verify-file-upload">
                      Select File
                    </label>
                  </Button>
                </div>

                {file && (
                  <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">{file.name}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Hash Input Verification */}
            <Card className="shadow-card bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Hash className="h-5 w-5 text-primary" />
                  Verify by Hash
                </CardTitle>
                <CardDescription>
                  Enter a SHA-256 hash directly to verify its authenticity
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="hash-input">SHA-256 Hash</Label>
                  <Input
                    id="hash-input"
                    type="text"
                    placeholder="Enter 64-character SHA-256 hash..."
                    value={hashInput}
                    onChange={(e) => setHashInput(e.target.value)}
                    className="font-mono text-sm"
                    disabled={verifying}
                  />
                </div>
                <Button 
                  onClick={handleHashVerification}
                  disabled={verifying || !hashInput.trim()}
                  className="w-full"
                  variant="default"
                >
                  {verifying ? (
                    <>
                      <Search className="h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4" />
                      Verify Hash
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Verification Result */}
          {result && (
            <Card className="mt-8 shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {result.status === 'verified' && <CheckCircle className="h-5 w-5 text-success" />}
                  {result.status === 'not-found' && <XCircle className="h-5 w-5 text-warning" />}
                  {result.status === 'error' && <AlertTriangle className="h-5 w-5 text-destructive" />}
                  Verification Result
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Status:</span>
                    <Badge 
                      variant={
                        result.status === 'verified' ? 'default' : 
                        result.status === 'not-found' ? 'secondary' : 
                        'destructive'
                      }
                    >
                      {result.status === 'verified' && 'Verified ✓'}
                      {result.status === 'not-found' && 'Not Found'}
                      {result.status === 'error' && 'Error'}
                    </Badge>
                  </div>

                  {result.status === 'verified' && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Timestamp:</span>
                        <span className="text-sm text-muted-foreground">
                          {new Date(result.timestamp!).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Blockchain Record:</span>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {result.blockchainRecord}
                        </code>
                      </div>
                      <div className="p-4 bg-success/10 border border-success/20 rounded-lg">
                        <p className="text-sm text-success font-medium">
                          ✓ File authenticity confirmed on Solana blockchain
                        </p>
                      </div>
                    </>
                  )}

                  {result.status === 'not-found' && (
                    <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
                      <p className="text-sm text-warning font-medium">
                        ⚠ No blockchain record found for this file
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        This file may not have been authenticated through FilmAuth
                      </p>
                    </div>
                  )}

                  {result.status === 'error' && (
                    <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                      <p className="text-sm text-destructive font-medium">
                        ✗ Verification failed
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Please check your connection and try again
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </section>
  );
};

export default FileVerification;
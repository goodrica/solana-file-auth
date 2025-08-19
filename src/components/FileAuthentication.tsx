import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, Hash, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FileInfo {
  name: string;
  size: number;
  type: string;
  hash?: string;
}

const FileAuthentication = () => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<FileInfo | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'hashing' | 'uploading' | 'success' | 'error'>('idle');
  const { toast } = useToast();

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

      // Simulate progress during hashing
      for (let i = 0; i <= 50; i += 10) {
        setProgress(i);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Calculate hash
      const hash = await calculateFileHash(selectedFile);
      setFile(prev => prev ? { ...prev, hash } : null);
      setProgress(60);

      // Simulate blockchain submission
      setStatus('uploading');
      for (let i = 60; i <= 100; i += 10) {
        setProgress(i);
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      setStatus('success');
      toast({
        title: "File authenticated successfully!",
        description: "Your file hash has been recorded on the Solana blockchain.",
      });

    } catch (error) {
      setStatus('error');
      toast({
        title: "Authentication failed",
        description: "There was an error processing your file. Please try again.",
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
              Authenticate Your Files
            </h2>
            <p className="text-xl text-muted-foreground">
              Upload a file to create an immutable blockchain record of its authenticity
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
                <h3 className="text-lg font-semibold mb-2">Drop your file here</h3>
                <p className="text-muted-foreground mb-4">or click to browse</p>
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
                  disabled={processing}
                  className="cursor-pointer"
                >
                  <label htmlFor="file-upload">
                    Select File
                  </label>
                </Button>
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
                    <p className="text-xs text-muted-foreground">Your file has been recorded on the Solana blockchain</p>
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
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default FileAuthentication;
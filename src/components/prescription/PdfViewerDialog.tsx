import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Loader2, ExternalLink } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { prescriptionFileService } from "@/services/prescriptionFileService";

interface PdfViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storagePath: string;
  title?: string;
}

export function PdfViewerDialog({
  open,
  onOpenChange,
  storagePath,
  title = "Prescription PDF",
}: PdfViewerDialogProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const fetchPdf = async () => {
    if (pdfUrl || !storagePath) return;

    setLoading(true);
    try {
      // Phase 1: no PDF fetching. Phase 2 will provide a signed URL implementation.
      const url = await prescriptionFileService.getPrescriptionFileUrl(storagePath);

      if (!url) {
        throw new Error('Prescription PDF viewing will be enabled in Phase 2');
      }

      setPdfUrl(url);
    } catch (err: any) {
      console.error("Error fetching PDF:", err);
      toast({
        title: "PDF unavailable",
        description: err.message || "Prescription PDF viewing will be enabled in Phase 2",
        variant: "destructive",
      });
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!pdfUrl) return;
    
    setDownloading(true);
    try {
      const response = await fetch(pdfUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = storagePath.split("/").pop() || "prescription.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Download started",
        description: "Your PDF is downloading",
      });
    } catch (err) {
      console.error("Download error:", err);
      toast({
        title: "Download failed",
        description: "Could not download the PDF",
        variant: "destructive",
      });
    } finally {
      setDownloading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setPdfUrl(null);
    }
    onOpenChange(newOpen);
  };

  // Fetch PDF when dialog opens
  if (open && !pdfUrl && !loading) {
    fetchPdf();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0" aria-describedby="pdf-viewer-description">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription id="pdf-viewer-description">
                View and download the prescription PDF
              </DialogDescription>
            </div>
            <div className="flex gap-2">
              {pdfUrl && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(pdfUrl, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open in New Tab
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleDownload}
                    disabled={downloading}
                  >
                    {downloading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    Download
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden bg-muted/30">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : pdfUrl ? (
            <div className="w-full h-full flex flex-col items-center justify-center p-4">
              <object
                data={pdfUrl}
                type="application/pdf"
                className="w-full h-full"
              >
                {/* Fallback if object doesn't work */}
                <div className="flex flex-col items-center justify-center h-full text-center gap-4 p-8">
                  <p className="text-muted-foreground">
                    PDF preview may be blocked by your browser. Use the buttons above to view or download.
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => window.open(pdfUrl, "_blank")}>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open in New Tab
                    </Button>
                    <Button onClick={handleDownload} disabled={downloading}>
                      {downloading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4 mr-2" />
                      )}
                      Download PDF
                    </Button>
                  </div>
                </div>
              </object>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No PDF available
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

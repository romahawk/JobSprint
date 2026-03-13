import { useRef, useState } from "react";
import { Copy, Download, FileText, RefreshCw, Upload } from "lucide-react";
import { useApp } from "../../context";
import { useJobOs } from "../../hooks/useJobOs";
import { JobOsLayout } from "../../components/job-os/JobOsLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Textarea } from "../../components/ui/textarea";
import { buildGoogleDocTextExportUrl, extractTextFromCvFile, importGoogleDocText } from "../../../services/cvFileImportService";
import type { JobOsCvAsset, JobOsScriptAsset, JobOsTemplateAsset } from "../../types/jobOs";

async function copyText(value: string): Promise<void> {
  if (!value) return;
  await navigator.clipboard.writeText(value);
}

export default function JobOsAssetsPage() {
  const { session } = useApp();
  const { assets, cvProfiles, updateCv, addScript, addTemplate, syncNotice } = useJobOs(
    session?.userId ?? null
  );

  const [scriptDraft, setScriptDraft] = useState<Omit<JobOsScriptAsset, "id" | "lastUpdated" | "createdAt" | "updatedAt">>({
    title: "",
    scriptText: "",
    tags: [],
  });
  const [templateDraft, setTemplateDraft] = useState<Omit<JobOsTemplateAsset, "id" | "createdAt" | "updatedAt">>({
    title: "",
    templateText: "",
    tags: [],
  });
  const [cvStatus, setCvStatus] = useState<Record<string, string>>({});
  const [importingCvId, setImportingCvId] = useState<string | null>(null);
  const uploadInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  async function saveImportedText(cv: JobOsCvAsset, text: string, sourceLabel: string): Promise<void> {
    await updateCv(cv.id, {
      sourceText: text,
      sourceTextUpdatedAt: new Date().toISOString(),
    });
    setCvStatus((current) => ({
      ...current,
      [cv.id]: `${sourceLabel} imported ${text.length.toLocaleString()} characters into the CV snapshot.`,
    }));
  }

  async function importCvText(cv: JobOsCvAsset): Promise<void> {
    setImportingCvId(cv.id);
    try {
      const result = await importGoogleDocText(cv.fileUrl);
      await saveImportedText(cv, result.text, result.sourceLabel);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Automatic import could not read that document.";
      setCvStatus((current) => ({
        ...current,
        [cv.id]: `${message} Upload a DOCX/PDF or paste the latest CV text snapshot manually if the document is private or blocks browser export.`,
      }));
    } finally {
      setImportingCvId(null);
    }
  }

  async function handleFileUpload(cv: JobOsCvAsset, file: File): Promise<void> {
    setImportingCvId(cv.id);
    try {
      const result = await extractTextFromCvFile(file);
      await saveImportedText(cv, result.text, result.sourceLabel);
    } catch (error) {
      setCvStatus((current) => ({
        ...current,
        [cv.id]: error instanceof Error ? error.message : "The uploaded file could not be processed.",
      }));
    } finally {
      setImportingCvId(null);
    }
  }

  return (
    <JobOsLayout
      title="Assets Vault"
      subtitle="Reusable CVs, scripts, and templates"
      notice={syncNotice}
    >
      <Tabs defaultValue="cvs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="cvs">CVs</TabsTrigger>
          <TabsTrigger value="scripts">Scripts</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="cvs" className="space-y-4">
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {assets.cvs.map((cv) => {
              const linkedProfile = cvProfiles.find((profile) => profile.id === cv.linkedProfileId);
              const canImportFromGoogleDocs = Boolean(buildGoogleDocTextExportUrl(cv.fileUrl));

              return (
                <Card key={cv.id}>
                  <CardHeader>
                    <CardTitle className="text-sm">{cv.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Input
                      value={cv.version}
                      onChange={(event) => {
                        void updateCv(cv.id, { version: event.target.value });
                      }}
                      placeholder="Version"
                    />
                    <Input
                      value={cv.fileUrl}
                      onChange={(event) => {
                        void updateCv(cv.id, { fileUrl: event.target.value });
                      }}
                      placeholder="File URL"
                    />
                    <div className="space-y-2">
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Linked tailoring profile</div>
                      <Select
                        value={cv.linkedProfileId ?? ""}
                        onValueChange={(value) => void updateCv(cv.id, { linkedProfileId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a default profile" />
                        </SelectTrigger>
                        <SelectContent>
                          {cvProfiles.map((profile) => (
                            <SelectItem key={profile.id} value={profile.id}>
                              {profile.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        {linkedProfile
                          ? `CV Optimizer will auto-select ${linkedProfile.name} when this CV is chosen.`
                          : "Pick the default positioning profile that should travel with this CV."}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/30 p-3">
                      <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                        <span>Latest CV text snapshot</span>
                        <span>{cv.sourceTextUpdatedAt ? new Date(cv.sourceTextUpdatedAt).toLocaleString() : "Not imported yet"}</span>
                      </div>
                      <Textarea
                        className="mt-3"
                        value={cv.sourceText ?? ""}
                        onChange={(event) => {
                          void updateCv(cv.id, {
                            sourceText: event.target.value,
                            sourceTextUpdatedAt: new Date().toISOString(),
                          });
                        }}
                        rows={10}
                        placeholder="Paste the latest plain-text CV snapshot here. The CV Optimizer will use this text for comparison before falling back to the linked tailoring profile."
                      />
                    </div>
                    {cvStatus[cv.id] ? (
                      <p className="text-xs text-muted-foreground">{cvStatus[cv.id]}</p>
                    ) : null}
                    <div className="rounded-lg border border-dashed border-border bg-white/70 px-3 py-3 text-xs text-muted-foreground dark:bg-neutral-950/30">
                      Best path: upload a `.docx` CV. PDFs work, but extraction quality depends on layout. Google Docs import is convenient, not guaranteed.
                    </div>
                    <div className="flex items-center justify-between text-xs text-neutral-500">
                      <span>{cv.locked ? "Locked CV" : "Unlocked"}</span>
                      <span>{new Date(cv.updatedAt).toLocaleDateString()}</span>
                    </div>
                    <input
                      ref={(node) => {
                        uploadInputRefs.current[cv.id] = node;
                      }}
                      type="file"
                      accept=".docx,.pdf,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) {
                          void handleFileUpload(cv, file);
                        }
                        event.currentTarget.value = "";
                      }}
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        disabled={importingCvId === cv.id}
                        onClick={() => uploadInputRefs.current[cv.id]?.click()}
                      >
                        {importingCvId === cv.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />} Upload CV
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        disabled={!cv.fileUrl}
                        onClick={() => window.open(cv.fileUrl, "_blank", "noopener,noreferrer")}
                      >
                        <Download className="w-3 h-3" /> Open Link
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        disabled={!canImportFromGoogleDocs || importingCvId === cv.id}
                        onClick={() => void importCvText(cv)}
                      >
                        <FileText className="w-3 h-3" /> Import Doc Text
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        disabled={!cv.fileUrl}
                        onClick={() => {
                          void copyText(cv.fileUrl);
                        }}
                      >
                        <Copy className="w-3 h-3" /> Copy Link
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="scripts" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Add Script</CardTitle></CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-3">
              <Input
                value={scriptDraft.title}
                onChange={(event) => setScriptDraft((current) => ({ ...current, title: event.target.value }))}
                placeholder="Script title"
              />
              <Input
                value={scriptDraft.tags.join(", ")}
                onChange={(event) =>
                  setScriptDraft((current) => ({
                    ...current,
                    tags: event.target.value.split(",").map((tag) => tag.trim()).filter(Boolean),
                  }))
                }
                placeholder="tags: referral, recruiter"
              />
              <Button
                onClick={() => {
                  if (!scriptDraft.title || !scriptDraft.scriptText) return;
                  void addScript(scriptDraft);
                  setScriptDraft({ title: "", scriptText: "", tags: [] });
                }}
              >
                Save Script
              </Button>
              <div className="md:col-span-3">
                <Textarea
                  value={scriptDraft.scriptText}
                  onChange={(event) =>
                    setScriptDraft((current) => ({ ...current, scriptText: event.target.value }))
                  }
                  rows={5}
                  placeholder="Write outreach script..."
                />
              </div>
            </CardContent>
          </Card>
          <div className="space-y-3">
            {assets.scripts.map((script) => (
              <Card key={script.id}>
                <CardContent className="pt-6 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{script.title}</p>
                      <p className="text-xs text-neutral-500">{script.tags.join(", ") || "No tags"}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => void copyText(script.scriptText)}>Copy</Button>
                      <Button size="sm" variant="outline" onClick={() => void copyText(`${script.title}\n\n${script.scriptText}`)}>Quick Insert</Button>
                    </div>
                  </div>
                  <p className="text-sm whitespace-pre-wrap text-neutral-700 dark:text-neutral-300">{script.scriptText}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Add Template</CardTitle></CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-3">
              <Input
                value={templateDraft.title}
                onChange={(event) => setTemplateDraft((current) => ({ ...current, title: event.target.value }))}
                placeholder="Template title"
              />
              <Input
                value={templateDraft.tags.join(", ")}
                onChange={(event) =>
                  setTemplateDraft((current) => ({
                    ...current,
                    tags: event.target.value.split(",").map((tag) => tag.trim()).filter(Boolean),
                  }))
                }
                placeholder="tags"
              />
              <Button
                onClick={() => {
                  if (!templateDraft.title || !templateDraft.templateText) return;
                  void addTemplate(templateDraft);
                  setTemplateDraft({ title: "", templateText: "", tags: [] });
                }}
              >
                Save Template
              </Button>
              <div className="md:col-span-3">
                <Textarea
                  value={templateDraft.templateText}
                  onChange={(event) =>
                    setTemplateDraft((current) => ({ ...current, templateText: event.target.value }))
                  }
                  rows={5}
                  placeholder="Reusable template..."
                />
              </div>
            </CardContent>
          </Card>
          <div className="space-y-3">
            {assets.templates.map((template) => (
              <Card key={template.id}>
                <CardContent className="pt-6 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{template.title}</p>
                      <p className="text-xs text-neutral-500">{template.tags.join(", ") || "No tags"}</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => void copyText(template.templateText)}>
                      Copy
                    </Button>
                  </div>
                  <p className="text-sm whitespace-pre-wrap text-neutral-700 dark:text-neutral-300">{template.templateText}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </JobOsLayout>
  );
}

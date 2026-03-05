import { useState } from "react";
import { Copy, Download } from "lucide-react";
import { useApp } from "../../context";
import { useJobOs } from "../../hooks/useJobOs";
import { JobOsLayout } from "../../components/job-os/JobOsLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Textarea } from "../../components/ui/textarea";
import type { JobOsScriptAsset, JobOsTemplateAsset } from "../../types/jobOs";

async function copyText(value: string): Promise<void> {
  if (!value) return;
  await navigator.clipboard.writeText(value);
}

export default function JobOsAssetsPage() {
  const { session } = useApp();
  const { assets, updateCv, addScript, addTemplate, syncNotice } = useJobOs(
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
          <div className="grid md:grid-cols-3 gap-4">
            {assets.cvs.map((cv) => (
              <Card key={cv.id}>
                <CardHeader>
                  <CardTitle className="text-sm">{cv.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Input
                    value={cv.version}
                    onChange={(e) => {
                      void updateCv(cv.id, { version: e.target.value });
                    }}
                    placeholder="Version"
                  />
                  <Input
                    value={cv.fileUrl}
                    onChange={(e) => {
                      void updateCv(cv.id, { fileUrl: e.target.value });
                    }}
                    placeholder="File URL"
                  />
                  <div className="flex items-center justify-between text-xs text-neutral-500">
                    <span>{cv.locked ? "Locked CV" : "Unlocked"}</span>
                    <span>{new Date(cv.updatedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      disabled={!cv.fileUrl}
                      onClick={() => window.open(cv.fileUrl, "_blank", "noopener,noreferrer")}
                    >
                      <Download className="w-3 h-3" /> Download
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
            ))}
          </div>
        </TabsContent>

        <TabsContent value="scripts" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Add Script</CardTitle></CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-3">
              <Input
                value={scriptDraft.title}
                onChange={(e) => setScriptDraft((p) => ({ ...p, title: e.target.value }))}
                placeholder="Script title"
              />
              <Input
                value={scriptDraft.tags.join(", ")}
                onChange={(e) =>
                  setScriptDraft((p) => ({
                    ...p,
                    tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean),
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
                  onChange={(e) =>
                    setScriptDraft((p) => ({ ...p, scriptText: e.target.value }))
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
                onChange={(e) => setTemplateDraft((p) => ({ ...p, title: e.target.value }))}
                placeholder="Template title"
              />
              <Input
                value={templateDraft.tags.join(", ")}
                onChange={(e) =>
                  setTemplateDraft((p) => ({
                    ...p,
                    tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean),
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
                  onChange={(e) =>
                    setTemplateDraft((p) => ({ ...p, templateText: e.target.value }))
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

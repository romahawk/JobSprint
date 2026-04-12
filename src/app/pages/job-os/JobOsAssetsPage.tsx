import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import { Check, ChevronsUpDown, Copy, Download, FileText, Plus, RefreshCw, Sparkles, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { useJobOsContext } from "../../context/JobOsContext";
import { JobOsTransferControls } from "../../components/job-os/JobOsTransferControls";
import { JobOsLayout } from "../../components/job-os/JobOsLayout";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../../components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "../../components/ui/command";
import { Textarea } from "../../components/ui/textarea";
import {
  getApplicationCvAssetId,
  MAX_CV_ASSETS,
  getApplicationCvLabel,
  getDefaultCvAsset,
} from "../../services/cvAssets";
import type { JobOsCvAsset, JobOsScriptAsset, JobOsTemplateAsset } from "../../types/jobOs";

async function copyText(value: string): Promise<void> {
  if (!value) return;
  await navigator.clipboard.writeText(value);
}

function buildGoogleDocTextExportUrl(value: string): string | null {
  const match = value.match(/docs\.google\.com\/document\/d\/([^/]+)/i);
  if (!match) return null;
  return `https://docs.google.com/document/d/${match[1]}/export?format=txt`;
}

function getReadiness(cv: JobOsCvAsset): {
  label: string;
  tone: string;
  missing: string[];
} {
  const missing: string[] = [];
  if (!cv.linkedProfileId) missing.push("profile");
  if (!cv.fileUrl.trim()) missing.push("source link");
  if (!cv.sourceText?.trim()) missing.push("text snapshot");

  if (missing.length === 0) {
    return {
      label: "Ready",
      tone: "text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-950/30 dark:border-emerald-900",
      missing,
    };
  }

  if (missing.length === 1) {
    return {
      label: "Needs 1 fix",
      tone: "text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-950/30 dark:border-amber-900",
      missing,
    };
  }

  return {
    label: "Incomplete",
    tone: "text-rose-700 bg-rose-50 border-rose-200 dark:text-rose-300 dark:bg-rose-950/30 dark:border-rose-900",
    missing,
  };
}

export default function JobOsAssetsPage() {
  const {
    assets,
    applications,
    companies,
    cvProfiles,
    cvTailoringRuns,
    roles,
    updateCv,
    addCv,
    removeCv,
    addScript,
    updateScript,
    removeScript,
    addTemplate,
    updateTemplate,
    removeTemplate,
    syncNotice,
    exportState,
    replaceState,
  } = useJobOsContext();

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
  const [selectedCvId, setSelectedCvId] = useState<string>("");
  const [profilePopoverOpen, setProfilePopoverOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<
    | { kind: "cv"; item: JobOsCvAsset }
    | { kind: "script"; item: JobOsScriptAsset }
    | { kind: "template"; item: JobOsTemplateAsset }
    | null
  >(null);
  const uploadInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const defaultCv = getDefaultCvAsset(assets.cvs);

  useEffect(() => {
    if (assets.cvs.length === 0) {
      setSelectedCvId("");
      return;
    }

    if (!selectedCvId || !assets.cvs.some((cv) => cv.id === selectedCvId)) {
      setSelectedCvId(defaultCv?.id ?? assets.cvs[0].id);
    }
  }, [assets.cvs, defaultCv?.id, selectedCvId]);

  useEffect(() => {
    setProfilePopoverOpen(false);
  }, [selectedCvId]);

  const selectedCv = assets.cvs.find((cv) => cv.id === selectedCvId) ?? defaultCv ?? null;

  const usageByCvName = useMemo(() => {
    const counts = new Map<string, number>();
    applications.forEach((application) => {
      const key = getApplicationCvAssetId(application, assets.cvs) ?? application.cvVersion.trim();
      if (!key) return;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    return counts;
  }, [applications, assets.cvs]);

  const tailoringByProfileId = useMemo(() => {
    const counts = new Map<string, number>();
    cvTailoringRuns.forEach((run) => {
      const key = run.cvProfileId.trim();
      if (!key) return;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    return counts;
  }, [cvTailoringRuns]);

  const selectedCvApplications = useMemo(() => {
    if (!selectedCv) return [];
    return applications.filter(
      (application) => getApplicationCvAssetId(application, assets.cvs) === selectedCv.id
    );
  }, [applications, assets.cvs, selectedCv]);

  async function saveImportedText(cv: JobOsCvAsset, text: string, sourceLabel: string): Promise<void> {
    await updateCv(cv.id, {
      sourceText: text,
      sourceTextUpdatedAt: new Date().toISOString(),
    });
    setCvStatus((current) => ({
      ...current,
      [cv.id]: `${sourceLabel} imported ${text.length.toLocaleString()} characters into the CV snapshot.`,
    }));
    toast.success(`${cv.name} snapshot updated`, {
      description: `${sourceLabel} imported ${text.length.toLocaleString()} characters.`,
    });
  }

  async function importCvText(cv: JobOsCvAsset): Promise<void> {
    setImportingCvId(cv.id);
    try {
      const { importGoogleDocText } = await import("../../../services/cvFileImportService");
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
      const { extractTextFromCvFile } = await import("../../../services/cvFileImportService");
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

  async function handleCreateCv(fromCv?: JobOsCvAsset): Promise<void> {
    try {
      const nextIndex = assets.cvs.length + 1;
      const createdId = await addCv({
        name: fromCv ? `${fromCv.name} Copy` : `CV Version ${nextIndex}`,
        version: fromCv?.version ?? "v1.0",
        fileUrl: fromCv?.fileUrl ?? "",
        sourceText: fromCv?.sourceText ?? "",
        sourceTextUpdatedAt: fromCv?.sourceText ? new Date().toISOString() : "",
        linkedProfileId: fromCv?.linkedProfileId ?? cvProfiles[0]?.id,
        isDefault: assets.cvs.length === 0,
        locked: false,
      });

      if (createdId) {
        setSelectedCvId(createdId);
        setCvStatus((current) => ({
          ...current,
          [createdId]: fromCv ? "Duplicated from the selected CV. Rename and tune it for a new lane." : "New CV shell created. Add a link, profile, and snapshot to make it optimizer-ready.",
        }));
        toast.success(fromCv ? "CV duplicated" : "CV created", {
          description: fromCv ? "A new variant is ready for editing." : "Your new CV shell is ready for details and snapshot import.",
        });
      }
    } catch (error) {
      toast.error("CV could not be created", {
        description: error instanceof Error ? error.message : "Try again after the current changes finish saving.",
      });
    }
  }

  async function handleDeleteCv(cv: JobOsCvAsset): Promise<void> {
    await removeCv(cv.id);
    setCvStatus((current) => {
      const next = { ...current };
      delete next[cv.id];
      return next;
    });
    toast.success("CV deleted", {
      description: `${cv.name} was removed from the library.`,
    });
  }

  async function handleDeleteScript(script: JobOsScriptAsset): Promise<void> {
    await removeScript(script.id);
    toast.success("Script deleted", {
      description: `${script.title} was removed from Assets.`,
    });
  }

  async function handleDeleteTemplate(template: JobOsTemplateAsset): Promise<void> {
    await removeTemplate(template.id);
    toast.success("Template deleted", {
      description: `${template.title} was removed from Assets.`,
    });
  }

  async function confirmDelete(): Promise<void> {
    if (!deleteTarget) return;

    if (deleteTarget.kind === "cv") {
      await handleDeleteCv(deleteTarget.item);
    } else if (deleteTarget.kind === "script") {
      await handleDeleteScript(deleteTarget.item);
    } else {
      await handleDeleteTemplate(deleteTarget.item);
    }

    setDeleteTarget(null);
  }

  function describeDeleteTarget(): { title: string; description: string } {
    if (!deleteTarget) {
      return { title: "", description: "" };
    }

    if (deleteTarget.kind === "cv") {
      const usageCount = usageByCvName.get(deleteTarget.item.id) ?? 0;
      return {
        title: `Delete ${deleteTarget.item.name}?`,
        description:
          usageCount > 0
            ? `${usageCount} application record(s) are linked to this CV asset. Historical labels stay visible, but this asset will disappear from future CV selection.`
            : "This removes the CV asset from your library and reassigns the default CV if needed.",
      };
    }

    if (deleteTarget.kind === "script") {
      return {
        title: `Delete ${deleteTarget.item.title}?`,
        description: "This outreach script will be removed from Assets and no longer appear in future selections.",
      };
    }

    return {
      title: `Delete ${deleteTarget.item.title}?`,
      description: "This template will be removed from Assets and no longer appear in future selections.",
    };
  }

  return (
    <JobOsLayout
      title="Assets Vault"
      subtitle="Build a compact CV library, keep the best source text fresh, and feed the optimizer with cleaner inputs."
      notice={syncNotice}
      settingsFooter={
        <JobOsTransferControls getExportState={exportState} onImportState={replaceState} />
      }
    >
      <Tabs defaultValue="cvs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="cvs">CVs</TabsTrigger>
          <TabsTrigger value="scripts">Scripts</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="cvs" className="space-y-4">
          <Card className="border-brand-blue/20 bg-gradient-to-r from-white via-slate-50 to-blue-50 dark:from-neutral-950 dark:via-neutral-950 dark:to-slate-900">
            <CardContent className="flex flex-col gap-4 pt-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">CV Constructor</div>
                <div className="mt-2 text-lg font-semibold text-foreground">
                  Manage up to {MAX_CV_ASSETS} intentional CV variants instead of one crowded blob.
                </div>
                <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
                  Each CV should represent a hiring lane. Keep one clear default, import the freshest text snapshot, and let JobSprint show which versions are actually being used.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="rounded-full border border-border bg-white/80 px-3 py-1.5 text-xs text-muted-foreground dark:bg-neutral-950/60">
                  {assets.cvs.length}/{MAX_CV_ASSETS} CVs
                </div>
                <div className="rounded-full border border-border bg-white/80 px-3 py-1.5 text-xs text-muted-foreground dark:bg-neutral-950/60">
                  {assets.cvs.filter((cv) => getReadiness(cv).missing.length === 0).length} ready
                </div>
                <Button
                  type="button"
                  size="sm"
                  className="gap-1.5"
                  disabled={assets.cvs.length >= MAX_CV_ASSETS}
                  onClick={() => void handleCreateCv()}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add CV
                </Button>
              </div>
            </CardContent>
          </Card>

          {assets.cvs.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-start gap-4 py-10">
                <div className="rounded-2xl bg-brand-blue/10 p-3 text-brand-blue">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Create your first CV asset</h3>
                  <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                    Start with one base CV, link it to a positioning profile, and import a clean text snapshot. Once that is working, duplicate it into sharper variants for different tracks.
                  </p>
                </div>
                <Button type="button" onClick={() => void handleCreateCv()}>
                  Add First CV
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
              <Card className="xl:sticky xl:top-20">
                <CardHeader>
                  <CardTitle className="text-sm">CV Library</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {assets.cvs.map((cv) => {
                    const readiness = getReadiness(cv);
                    const usageCount = usageByCvName.get(cv.id) ?? 0;
                    const runCount = cv.linkedProfileId ? tailoringByProfileId.get(cv.linkedProfileId) ?? 0 : 0;

                    return (
                      <button
                        key={cv.id}
                        type="button"
                        onClick={() => setSelectedCvId(cv.id)}
                        className={`w-full rounded-xl border p-3 text-left transition-colors ${
                          selectedCv?.id === cv.id
                            ? "border-brand-blue bg-brand-blue/5 shadow-sm"
                            : "border-border bg-white hover:border-brand-blue/40 dark:bg-neutral-950"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-medium text-foreground">{cv.name || "Untitled CV"}</div>
                            <div className="mt-1 text-xs text-muted-foreground">
                              {cv.version || "No version"} {cv.isDefault ? "- Default" : ""}
                            </div>
                          </div>
                          <span className={`rounded-full border px-2 py-0.5 text-[11px] ${readiness.tone}`}>
                            {readiness.label}
                          </span>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                          <span>{usageCount} apps</span>
                          <span>{runCount} tailor runs</span>
                          <span>{cv.sourceText?.trim() ? `${cv.sourceText.length.toLocaleString()} chars` : "No snapshot"}</span>
                        </div>
                      </button>
                    );
                  })}
                </CardContent>
              </Card>

              {selectedCv ? (
                <div className="space-y-4">
                  <Card>
                    <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <CardTitle className="text-base">{selectedCv.name || "Untitled CV"}</CardTitle>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Keep this asset narrow and intentional. One CV should represent one positioning story.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {!selectedCv.isDefault ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              void updateCv(selectedCv.id, { isDefault: true });
                              toast.success("Default CV updated", {
                                description: `${selectedCv.name} will now be suggested first across Job OS.`,
                              });
                            }}
                          >
                            Set Default
                          </Button>
                        ) : null}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={assets.cvs.length >= MAX_CV_ASSETS}
                          onClick={() => void handleCreateCv(selectedCv)}
                        >
                          Duplicate
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => setDeleteTarget({ kind: "cv", item: selectedCv })}
                        >
                          <Trash2 className="mr-1 h-3.5 w-3.5" />
                          Delete
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="space-y-2">
                          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Name</div>
                          <Input
                            value={selectedCv.name}
                            onChange={(event) => void updateCv(selectedCv.id, { name: event.target.value })}
                            placeholder="CV name"
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Version</div>
                          <Input
                            value={selectedCv.version}
                            onChange={(event) => void updateCv(selectedCv.id, { version: event.target.value })}
                            placeholder="v1.0"
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Source Link</div>
                          <Input
                            value={selectedCv.fileUrl}
                            onChange={(event) => void updateCv(selectedCv.id, { fileUrl: event.target.value })}
                            placeholder="Google Doc, Drive export, or source file link"
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Linked Tailoring Profile</div>
                          <Popover open={profilePopoverOpen} onOpenChange={setProfilePopoverOpen}>
                            <PopoverTrigger asChild>
                              <button
                                role="combobox"
                                aria-expanded={profilePopoverOpen}
                                className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-1 text-sm text-foreground shadow-sm transition-colors hover:bg-accent/40 focus:outline-none focus:ring-1 focus:ring-ring"
                              >
                                <span className={selectedCv.linkedProfileId ? "" : "text-muted-foreground"}>
                                  {selectedCv.linkedProfileId
                                    ? (cvProfiles.find((p) => p.id === selectedCv.linkedProfileId)?.name ?? "Unknown profile")
                                    : "No linked profile"}
                                </span>
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[280px] p-0" align="start">
                              <Command>
                                <CommandInput placeholder="Search profiles..." />
                                <CommandList>
                                  <CommandEmpty>No profiles found.</CommandEmpty>
                                  <CommandGroup>
                                    <CommandItem
                                      value="none"
                                      onSelect={() => {
                                        void updateCv(selectedCv.id, { linkedProfileId: undefined });
                                        setProfilePopoverOpen(false);
                                      }}
                                    >
                                      <Check className={`mr-2 h-4 w-4 ${!selectedCv.linkedProfileId ? "opacity-100" : "opacity-0"}`} />
                                      No linked profile
                                    </CommandItem>
                                    {cvProfiles.map((profile) => (
                                      <CommandItem
                                        key={profile.id}
                                        value={profile.name}
                                        onSelect={() => {
                                          void updateCv(selectedCv.id, { linkedProfileId: profile.id });
                                          setProfilePopoverOpen(false);
                                        }}
                                      >
                                        <Check className={`mr-2 h-4 w-4 ${selectedCv.linkedProfileId === profile.id ? "opacity-100" : "opacity-0"}`} />
                                        {profile.name}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>

                      <div className="grid gap-3 md:grid-cols-3">
                        <div className="rounded-xl border border-border bg-muted/30 p-4">
                          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Readiness</div>
                          <div className="mt-2 text-sm font-medium">{getReadiness(selectedCv).label}</div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {getReadiness(selectedCv).missing.length === 0
                              ? "This CV is ready for the optimizer."
                              : `Still missing: ${getReadiness(selectedCv).missing.join(", ")}.`}
                          </div>
                        </div>
                        <div className="rounded-xl border border-border bg-muted/30 p-4">
                          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Usage</div>
                          <div className="mt-2 text-sm font-medium">{usageByCvName.get(selectedCv.id) ?? 0} applications</div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            Applications now keep a stable CV asset link, so renaming this CV will not break the relationship.
                          </div>
                        </div>
                        <div className="rounded-xl border border-border bg-muted/30 p-4">
                          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Optimizer Activity</div>
                          <div className="mt-2 text-sm font-medium">
                            {selectedCv.linkedProfileId ? tailoringByProfileId.get(selectedCv.linkedProfileId) ?? 0 : 0} tailoring runs
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {selectedCv.sourceTextUpdatedAt
                              ? `Snapshot refreshed ${new Date(selectedCv.sourceTextUpdatedAt).toLocaleString()}.`
                              : "No imported text snapshot yet."}
                          </div>
                        </div>
                      </div>

                      <div className="rounded-xl border border-border bg-white/80 p-4 dark:bg-neutral-950/40">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Used By Applications</div>
                            <div className="mt-1 text-sm text-muted-foreground">
                              Jump straight from this CV asset to the application records currently using it.
                            </div>
                          </div>
                          <div className="text-sm font-medium">{selectedCvApplications.length}</div>
                        </div>
                        {selectedCvApplications.length > 0 ? (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {selectedCvApplications.map((application) => {
                              const companyName = companies.find((company) => company.id === application.companyId)?.name ?? "Unknown company";
                              const roleTitle = roles.find((role) => role.id === application.roleId)?.title ?? "Unlinked role";
                              return (
                                <Link
                                  key={application.id}
                                  to={`/cv-optimizer?applicationId=${application.id}`}
                                  className="rounded-full border border-border px-3 py-1.5 text-xs transition-colors hover:border-brand-blue/40 hover:bg-brand-blue/5"
                                >
                                  {companyName} - {roleTitle} - {getApplicationCvLabel(application, assets.cvs)}
                                </Link>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="mt-4 text-sm text-muted-foreground">
                            No applications are linked to this CV yet.
                          </p>
                        )}
                      </div>

                      <div className="rounded-lg border border-border bg-muted/30 p-3">
                        <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                          <span>Latest CV text snapshot</span>
                          <span>{selectedCv.sourceTextUpdatedAt ? new Date(selectedCv.sourceTextUpdatedAt).toLocaleString() : "Not imported yet"}</span>
                        </div>
                        <Textarea
                          className="mt-3"
                          value={selectedCv.sourceText ?? ""}
                          onChange={(event) => {
                            void updateCv(selectedCv.id, {
                              sourceText: event.target.value,
                              sourceTextUpdatedAt: new Date().toISOString(),
                            });
                          }}
                          rows={14}
                          placeholder="Paste the latest plain-text CV snapshot here. Full CV Tailor uses this text to preserve your actual structure instead of guessing from profile data alone."
                        />
                      </div>

                      {cvStatus[selectedCv.id] ? (
                        <p className="text-xs text-muted-foreground">{cvStatus[selectedCv.id]}</p>
                      ) : null}

                      <div className="rounded-lg border border-dashed border-border bg-white/70 px-3 py-3 text-xs text-muted-foreground dark:bg-neutral-950/30">
                        Best path: upload a `.docx` CV. PDFs can work, but extraction quality depends on layout. Google Docs import is convenient, not guaranteed.
                      </div>

                      <input
                        ref={(node) => {
                          uploadInputRefs.current[selectedCv.id] = node;
                        }}
                        type="file"
                        accept=".docx,.pdf,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                        className="hidden"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) {
                            void handleFileUpload(selectedCv, file);
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
                          disabled={importingCvId === selectedCv.id}
                          onClick={() => uploadInputRefs.current[selectedCv.id]?.click()}
                        >
                          {importingCvId === selectedCv.id ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                          Upload CV
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="gap-1.5"
                          disabled={!selectedCv.fileUrl}
                          onClick={() => window.open(selectedCv.fileUrl, "_blank", "noopener,noreferrer")}
                        >
                          <Download className="h-3 w-3" />
                          Open Link
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="gap-1.5"
                          disabled={!buildGoogleDocTextExportUrl(selectedCv.fileUrl) || importingCvId === selectedCv.id}
                          onClick={() => void importCvText(selectedCv)}
                        >
                          <FileText className="h-3 w-3" />
                          Import Doc Text
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="gap-1.5"
                          disabled={!selectedCv.fileUrl}
                          onClick={() => {
                            void copyText(selectedCv.fileUrl);
                            toast.success("Source link copied", {
                              description: `${selectedCv.name} source link is ready to paste.`,
                            });
                          }}
                        >
                          <Copy className="h-3 w-3" />
                          Copy Link
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : null}
            </div>
          )}
        </TabsContent>

        <TabsContent value="scripts" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Add Script</CardTitle></CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-3">
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
                  toast.success("Script saved", {
                    description: "The new outreach script is available in your Assets library.",
                  });
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
          {assets.scripts.length === 0 ? (
            <Card>
              <CardContent className="py-10">
                <div className="max-w-2xl">
                  <h3 className="text-lg font-semibold">No scripts yet</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Save your best recruiter replies, outreach openers, and follow-up messages here so they are easy to reuse across Outreach and company detail flows.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
            {assets.scripts.map((script) => (
              <Card key={script.id}>
                <CardContent className="space-y-3 pt-6">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-xs text-neutral-500">
                      Last updated {new Date(script.updatedAt).toLocaleString()}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => { void copyText(script.scriptText); toast.success("Script copied", { description: `${script.title} is ready to paste.` }); }}>Copy</Button>
                      <Button size="sm" variant="outline" onClick={() => { void copyText(`${script.title}\n\n${script.scriptText}`); toast.success("Script inserted", { description: `${script.title} plus body copied to clipboard.` }); }}>Quick Insert</Button>
                      <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700" onClick={() => setDeleteTarget({ kind: "script", item: script })}>Delete</Button>
                    </div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Input
                      value={script.title}
                      onChange={(event) => void updateScript(script.id, { title: event.target.value })}
                      placeholder="Script title"
                    />
                    <Input
                      value={script.tags.join(", ")}
                      onChange={(event) =>
                        void updateScript(script.id, {
                          tags: event.target.value.split(",").map((tag) => tag.trim()).filter(Boolean),
                        })
                      }
                      placeholder="tags"
                    />
                  </div>
                  <Textarea
                    value={script.scriptText}
                    onChange={(event) => void updateScript(script.id, { scriptText: event.target.value })}
                    rows={5}
                    placeholder="Write outreach script..."
                  />
                </CardContent>
              </Card>
            ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Add Template</CardTitle></CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-3">
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
                  toast.success("Template saved", {
                    description: "The template is now available for reuse.",
                  });
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
          {assets.templates.length === 0 ? (
            <Card>
              <CardContent className="py-10">
                <div className="max-w-2xl">
                  <h3 className="text-lg font-semibold">No templates yet</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Store reusable CV summaries, intro paragraphs, and application snippets here so your best language is always one click away.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
            {assets.templates.map((template) => (
              <Card key={template.id}>
                <CardContent className="space-y-3 pt-6">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-xs text-neutral-500">
                      Updated {new Date(template.updatedAt).toLocaleString()}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => { void copyText(template.templateText); toast.success("Template copied", { description: `${template.title} is ready to paste.` }); }}>
                        Copy
                      </Button>
                      <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700" onClick={() => setDeleteTarget({ kind: "template", item: template })}>
                        Delete
                      </Button>
                    </div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Input
                      value={template.title}
                      onChange={(event) => void updateTemplate(template.id, { title: event.target.value })}
                      placeholder="Template title"
                    />
                    <Input
                      value={template.tags.join(", ")}
                      onChange={(event) =>
                        void updateTemplate(template.id, {
                          tags: event.target.value.split(",").map((tag) => tag.trim()).filter(Boolean),
                        })
                      }
                      placeholder="tags"
                    />
                  </div>
                  <Textarea
                    value={template.templateText}
                    onChange={(event) => void updateTemplate(template.id, { templateText: event.target.value })}
                    rows={5}
                    placeholder="Reusable template..."
                  />
                </CardContent>
              </Card>
            ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{describeDeleteTarget().title}</AlertDialogTitle>
            <AlertDialogDescription>{describeDeleteTarget().description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={() => void confirmDelete()}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </JobOsLayout>
  );
}


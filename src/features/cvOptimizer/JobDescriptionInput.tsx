import { Card, CardContent, CardHeader, CardTitle } from "../../app/components/ui/card";
import { Input } from "../../app/components/ui/input";
import { Label } from "../../app/components/ui/label";
import { Textarea } from "../../app/components/ui/textarea";

interface JobDescriptionInputProps {
  company: string;
  title: string;
  sourceUrl: string;
  rawText: string;
  onChange: (field: "company" | "title" | "sourceUrl" | "rawText", value: string) => void;
  roleHint?: string | null;
}

export function JobDescriptionInput({
  company,
  title,
  sourceUrl,
  rawText,
  onChange,
  roleHint,
}: JobDescriptionInputProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Job Description</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="cv-company">Company</Label>
            <Input id="cv-company" value={company} onChange={(event) => onChange("company", event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cv-title">Role title</Label>
            <Input id="cv-title" value={title} onChange={(event) => onChange("title", event.target.value)} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="cv-source-url">Role URL</Label>
          <Input
            id="cv-source-url"
            value={sourceUrl}
            onChange={(event) => onChange("sourceUrl", event.target.value)}
            placeholder="https://..."
          />
          {roleHint ? <p className="text-xs text-muted-foreground">{roleHint}</p> : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="cv-job-description">Paste or sync the job description</Label>
          <Textarea
            id="cv-job-description"
            value={rawText}
            onChange={(event) => onChange("rawText", event.target.value)}
            rows={16}
            placeholder="Paste the role description here. If the linked role already has a stored description, it will load automatically."
          />
        </div>
      </CardContent>
    </Card>
  );
}

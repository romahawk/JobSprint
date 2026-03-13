import { Card, CardContent, CardHeader, CardTitle } from "../../app/components/ui/card";
import { Label } from "../../app/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../app/components/ui/select";
import type { CvProfile } from "../../app/types/jobOs";

interface CvProfileSelectorProps {
  profiles: CvProfile[];
  selectedProfileId: string;
  onSelect: (value: string) => void;
}

export function CvProfileSelector({
  profiles,
  selectedProfileId,
  onSelect,
}: CvProfileSelectorProps) {
  const selectedProfile = profiles.find((profile) => profile.id === selectedProfileId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Base CV Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <Label>Select profile</Label>
          <Select value={selectedProfileId} onValueChange={onSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a base CV" />
            </SelectTrigger>
            <SelectContent>
              {profiles.map((profile) => (
                <SelectItem key={profile.id} value={profile.id}>
                  {profile.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {selectedProfile ? (
          <div className="rounded-lg border border-border bg-muted/40 px-3 py-3 text-sm">
            <div className="font-medium text-foreground">{selectedProfile.headline || selectedProfile.name}</div>
            <div className="mt-1 text-xs text-muted-foreground">{selectedProfile.targetTrack} track</div>
            <div className="mt-2 text-sm text-muted-foreground">
              {selectedProfile.summary || "Add a summary to make tailoring output more specific."}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

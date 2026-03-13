import { Badge } from "../../app/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../app/components/ui/card";

interface PortfolioSuggestionsProps {
  projects: string[];
}

export function PortfolioSuggestions({ projects }: PortfolioSuggestionsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Portfolio Suggestions</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {projects.length > 0 ? (
          projects.map((project) => (
            <Badge key={project} className="rounded-full bg-accent text-accent-foreground">
              {project}
            </Badge>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">Relevant portfolio projects will appear here.</p>
        )}
      </CardContent>
    </Card>
  );
}

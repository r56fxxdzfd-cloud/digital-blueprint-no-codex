import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { 
  BookOpen, Search, Download, Calendar, Flame, 
  ChevronRight, Heart, Lightbulb, Zap, MessageSquare 
} from 'lucide-react';
import { useJournalHistory, useJournalStats, exportJournalToCSV, JournalEntry } from '@/hooks/useJournalEntry';
import { useThemes } from '@/hooks/useThemes';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function JournalPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const { themes } = useThemes();
  const { entries, isLoading } = useJournalHistory({
    themeId: selectedThemeId,
    searchQuery: searchQuery.length >= 2 ? searchQuery : undefined,
  });
  const { stats } = useJournalStats();

  const handleExport = () => {
    exportJournalToCSV(entries);
  };

  const openDetail = (entry: JournalEntry) => {
    setSelectedEntry(entry);
    setDetailOpen(true);
  };

  const formatDate = (dateStr: string) => {
    return format(parseISO(dateStr), "EEEE, d 'de' MMMM", { locale: ptBR });
  };

  const getThemeName = (themeId: string | null) => {
    if (!themeId) return null;
    const theme = themes.find(t => t.id === themeId);
    return theme?.name || null;
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" />
              Histórico do Diário
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Suas anotações diárias
            </p>
          </div>

          {/* Stats badges */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{stats.daysLast30}</span>
              <span className="text-muted-foreground">dias (30d)</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="font-medium">{stats.currentStreak}</span>
              <span className="text-muted-foreground">streak</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar nos diários..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select 
                value={selectedThemeId || 'all'} 
                onValueChange={(v) => setSelectedThemeId(v === 'all' ? null : v)}
              >
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filtrar por tema" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os temas</SelectItem>
                  {themes.map(theme => (
                    <SelectItem key={theme.id} value={theme.id}>
                      {theme.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={handleExport} className="gap-2">
                <Download className="h-4 w-4" />
                Exportar CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Entries list */}
        {isLoading ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">Carregando...</div>
            </CardContent>
          </Card>
        ) : entries.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-muted-foreground">
                  {searchQuery || selectedThemeId 
                    ? 'Nenhuma entrada encontrada com os filtros aplicados.'
                    : 'Nenhuma entrada no diário ainda. Comece escrevendo em /today!'}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {entries.map(entry => (
              <Card 
                key={entry.id} 
                className="cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => openDetail(entry)}
              >
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0 space-y-2">
                      {/* Date and theme */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium capitalize">
                          {formatDate(entry.entry_date)}
                        </span>
                        {getThemeName(entry.theme_id) && (
                          <Badge variant="secondary" className="text-xs">
                            {getThemeName(entry.theme_id)}
                          </Badge>
                        )}
                      </div>

                      {/* Mood and emotion */}
                      {(entry.mood || entry.emotion) && (
                        <div className="flex items-center gap-2 text-sm">
                          {entry.mood && (
                            <Badge variant="outline">{entry.mood}</Badge>
                          )}
                          {entry.emotion && (
                            <Badge variant="outline">{entry.emotion}</Badge>
                          )}
                        </div>
                      )}

                      {/* Insight preview */}
                      {entry.insight && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          <Lightbulb className="inline h-3.5 w-3.5 mr-1" />
                          {entry.insight}
                        </p>
                      )}

                      {/* Action preview */}
                      {entry.action && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          <Zap className="inline h-3.5 w-3.5 mr-1" />
                          {entry.action}
                        </p>
                      )}
                    </div>

                    <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Detail dialog */}
        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            {selectedEntry && (
              <>
                <DialogHeader>
                  <DialogTitle className="capitalize">
                    {formatDate(selectedEntry.entry_date)}
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                  {/* Theme */}
                  {getThemeName(selectedEntry.theme_id) && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Tema:</span>
                      <Badge variant="secondary">
                        {getThemeName(selectedEntry.theme_id)}
                      </Badge>
                    </div>
                  )}

                  {/* Mood & Emotion */}
                  {(selectedEntry.mood || selectedEntry.emotion) && (
                    <div className="flex items-center gap-3">
                      {selectedEntry.mood && (
                        <div>
                          <span className="text-xs text-muted-foreground block">Humor</span>
                          <Badge>{selectedEntry.mood}</Badge>
                        </div>
                      )}
                      {selectedEntry.emotion && (
                        <div>
                          <span className="text-xs text-muted-foreground block">Emoção</span>
                          <Badge>{selectedEntry.emotion}</Badge>
                        </div>
                      )}
                    </div>
                  )}

                  <Separator />

                  {/* Insight */}
                  {selectedEntry.insight && (
                    <div>
                      <div className="flex items-center gap-2 text-sm font-medium mb-1">
                        <Lightbulb className="h-4 w-4 text-yellow-500" />
                        Insight
                      </div>
                      <p className="text-sm">{selectedEntry.insight}</p>
                    </div>
                  )}

                  {/* Action */}
                  {selectedEntry.action && (
                    <div>
                      <div className="flex items-center gap-2 text-sm font-medium mb-1">
                        <Zap className="h-4 w-4 text-primary" />
                        Ação
                      </div>
                      <p className="text-sm">{selectedEntry.action}</p>
                    </div>
                  )}

                  {/* Gratitude */}
                  {selectedEntry.gratitude && (
                    <div>
                      <div className="flex items-center gap-2 text-sm font-medium mb-1">
                        <Heart className="h-4 w-4 text-pink-500" />
                        Gratidão
                      </div>
                      <p className="text-sm">{selectedEntry.gratitude}</p>
                    </div>
                  )}

                  {/* Free note */}
                  {selectedEntry.free_note && (
                    <div>
                      <div className="flex items-center gap-2 text-sm font-medium mb-1">
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        Nota livre
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{selectedEntry.free_note}</p>
                    </div>
                  )}

                  <Separator />

                  <div className="text-xs text-muted-foreground">
                    Criado: {format(parseISO(selectedEntry.created_at), "dd/MM/yyyy 'às' HH:mm")}
                    {selectedEntry.updated_at !== selectedEntry.created_at && (
                      <span className="ml-3">
                        Atualizado: {format(parseISO(selectedEntry.updated_at), "dd/MM/yyyy 'às' HH:mm")}
                      </span>
                    )}
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}

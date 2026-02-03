import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit2, Clock, Zap, Volume2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useThemes } from '@/hooks/useThemes';
import { useVisualizations } from '@/hooks/useVisualizations';
import { useDailyEntries } from '@/hooks/useDailyEntry';
import { useSettings } from '@/hooks/useSettings';
import { useTTS } from '@/hooks/useTTS';
import { useBellSound } from '@/hooks/useBellSound';
import { TTSControls } from '@/components/TTSControls';
import { Theme, Visualization } from '@/lib/database.types';

export default function Library() {
  const { toast } = useToast();
  const { themes, createTheme, updateTheme } = useThemes();
  const { visualizations, createVisualization, updateVisualization } = useVisualizations();
  const { entries } = useDailyEntries(365);
  const { settings } = useSettings();
  
  const [editingTheme, setEditingTheme] = useState<Theme | null>(null);
  const [editingViz, setEditingViz] = useState<Visualization | null>(null);
  const [themeDialogOpen, setThemeDialogOpen] = useState(false);
  const [vizDialogOpen, setVizDialogOpen] = useState(false);
  const [previewViz, setPreviewViz] = useState<Visualization | null>(null);

  // TTS Hook with micro-chunking settings
  const { playBell } = useBellSound();

  // TTS Hook with micro-chunking settings
  const tts = useTTS({
    settings: {
      tts_enabled: settings?.tts_enabled ?? true,
      tts_rate: settings?.tts_rate ?? 0.62,
      tts_pitch: settings?.tts_pitch ?? 1.00,
      tts_volume: settings?.tts_volume ?? 1.00,
      tts_prefer_female: settings?.tts_prefer_female ?? true,
      tts_voice_uri: settings?.tts_voice_uri ?? null,
      tts_pause_base_ms: settings?.tts_pause_base_ms ?? 220,
      tts_pause_per_word_ms: settings?.tts_pause_per_word_ms ?? 65,
      tts_pause_sentence_extra_ms: settings?.tts_pause_sentence_extra_ms ?? 450,
      tts_pause_paragraph_extra_ms: settings?.tts_pause_paragraph_extra_ms ?? 900,
      tts_breath_pause_ms: settings?.tts_breath_pause_ms ?? 1700,
      tts_microchunk_min_words: settings?.tts_microchunk_min_words ?? 8,
      tts_microchunk_max_words: settings?.tts_microchunk_max_words ?? 14,
      tts_end_silence_ms: settings?.tts_end_silence_ms ?? 30000,
      tts_outro_enabled: settings?.tts_outro_enabled ?? true,
      tts_outro_text: settings?.tts_outro_text ?? '',
    },
    onEndSilenceComplete: playBell,
  });

  // Theme form
  const [themeName, setThemeName] = useState('');
  const [themeDescription, setThemeDescription] = useState('');
  const [themeActive, setThemeActive] = useState(true);

  // Visualization form
  const [vizThemeId, setVizThemeId] = useState('');
  const [vizTitle, setVizTitle] = useState('');
  const [vizScript, setVizScript] = useState('');
  const [vizDuration, setVizDuration] = useState(4);
  const [vizEnergyMin, setVizEnergyMin] = useState(0);
  const [vizEnergyMax, setVizEnergyMax] = useState(10);
  const [vizTags, setVizTags] = useState('');
  const [vizActive, setVizActive] = useState(true);

  // Filters
  const [filterTheme, setFilterTheme] = useState<string>('all');

  const getVisualizationUsageCount = (vizId: string) => {
    return entries.filter(e => e.visualization_id === vizId).length;
  };

  const resetThemeForm = () => {
    setThemeName('');
    setThemeDescription('');
    setThemeActive(true);
    setEditingTheme(null);
  };

  const resetVizForm = () => {
    setVizThemeId('');
    setVizTitle('');
    setVizScript('');
    setVizDuration(4);
    setVizEnergyMin(0);
    setVizEnergyMax(10);
    setVizTags('');
    setVizActive(true);
    setEditingViz(null);
  };

  const handleEditTheme = (theme: Theme) => {
    setEditingTheme(theme);
    setThemeName(theme.name);
    setThemeDescription(theme.description || '');
    setThemeActive(theme.is_active);
    setThemeDialogOpen(true);
  };

  const handleEditViz = (viz: Visualization) => {
    tts.stop(); // Stop any playing TTS
    setEditingViz(viz);
    setVizThemeId(viz.theme_id);
    setVizTitle(viz.title);
    setVizScript(viz.script);
    setVizDuration(viz.duration_min);
    setVizEnergyMin(viz.energy_min);
    setVizEnergyMax(viz.energy_max);
    setVizTags(viz.tags?.join(', ') || '');
    setVizActive(viz.is_active);
    setVizDialogOpen(true);
  };

  const handlePlayViz = (viz: Visualization) => {
    tts.stop();
    setPreviewViz(viz);
    tts.speak(viz.script, viz.title);
  };

  const handleStopViz = () => {
    tts.stop();
    setPreviewViz(null);
  };

  const handleSaveTheme = async () => {
    const data = { name: themeName, description: themeDescription || null, is_active: themeActive };
    
    if (editingTheme) {
      await updateTheme.mutateAsync({ id: editingTheme.id, ...data });
      toast({ title: 'Tema atualizado!' });
    } else {
      await createTheme.mutateAsync(data);
      toast({ title: 'Tema criado!' });
    }
    
    setThemeDialogOpen(false);
    resetThemeForm();
  };

  const handleSaveViz = async () => {
    const tags = vizTags.split(',').map(t => t.trim()).filter(Boolean);
    const data = {
      theme_id: vizThemeId,
      title: vizTitle,
      script: vizScript,
      duration_min: vizDuration,
      energy_min: vizEnergyMin,
      energy_max: vizEnergyMax,
      tags,
      is_active: vizActive,
    };
    
    if (editingViz) {
      await updateVisualization.mutateAsync({ id: editingViz.id, ...data });
      toast({ title: 'Visualização atualizada!' });
    } else {
      await createVisualization.mutateAsync(data);
      toast({ title: 'Visualização criada!' });
    }
    
    setVizDialogOpen(false);
    resetVizForm();
  };

  const filteredVisualizations = filterTheme === 'all' 
    ? visualizations 
    : visualizations.filter(v => v.theme_id === filterTheme);

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <Tabs defaultValue="themes">
          <TabsList className="mb-6">
            <TabsTrigger value="themes">Temas</TabsTrigger>
            <TabsTrigger value="visualizations">Visualizações</TabsTrigger>
          </TabsList>

          <TabsContent value="themes" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={themeDialogOpen} onOpenChange={(open) => { setThemeDialogOpen(open); if (!open) resetThemeForm(); }}>
                <DialogTrigger asChild>
                  <Button><Plus className="h-4 w-4 mr-2" />Novo Tema</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingTheme ? 'Editar Tema' : 'Novo Tema'}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Nome</Label>
                      <Input value={themeName} onChange={(e) => setThemeName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Descrição</Label>
                      <Textarea value={themeDescription} onChange={(e) => setThemeDescription(e.target.value)} />
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={themeActive} onCheckedChange={setThemeActive} />
                      <Label>Ativo</Label>
                    </div>
                    <Button onClick={handleSaveTheme} className="w-full">Salvar</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {themes.map((theme) => (
                <Card key={theme.id} className={!theme.is_active ? 'opacity-50' : ''}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{theme.name}</CardTitle>
                      <Button variant="ghost" size="sm" onClick={() => handleEditTheme(theme)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{theme.description || 'Sem descrição'}</p>
                    {!theme.is_active && <Badge variant="outline" className="mt-2">Inativo</Badge>}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="visualizations" className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <Select value={filterTheme} onValueChange={setFilterTheme}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar por tema" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os temas</SelectItem>
                  {themes.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Dialog open={vizDialogOpen} onOpenChange={(open) => { setVizDialogOpen(open); if (!open) resetVizForm(); }}>
                <DialogTrigger asChild>
                  <Button><Plus className="h-4 w-4 mr-2" />Nova Visualização</Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingViz ? 'Editar Visualização' : 'Nova Visualização'}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Tema</Label>
                      <Select value={vizThemeId} onValueChange={setVizThemeId}>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>
                          {themes.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Título</Label>
                      <Input value={vizTitle} onChange={(e) => setVizTitle(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Script</Label>
                      <Textarea rows={5} value={vizScript} onChange={(e) => setVizScript(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Duração (min)</Label>
                        <Input type="number" value={vizDuration} onChange={(e) => setVizDuration(+e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Energia min</Label>
                        <Input type="number" min={0} max={10} value={vizEnergyMin} onChange={(e) => setVizEnergyMin(+e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Energia max</Label>
                        <Input type="number" min={0} max={10} value={vizEnergyMax} onChange={(e) => setVizEnergyMax(+e.target.value)} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Tags (separadas por vírgula)</Label>
                      <Input value={vizTags} onChange={(e) => setVizTags(e.target.value)} />
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={vizActive} onCheckedChange={setVizActive} />
                      <Label>Ativa</Label>
                    </div>
                    <Button onClick={handleSaveViz} className="w-full">Salvar</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-4">
              {filteredVisualizations.map((viz) => {
                const theme = themes.find(t => t.id === viz.theme_id);
                const usageCount = getVisualizationUsageCount(viz.id);
                const isPlaying = previewViz?.id === viz.id && tts.isSpeaking;
                
                return (
                  <Card key={viz.id} className={!viz.is_active ? 'opacity-50' : ''}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base">{viz.title}</CardTitle>
                          <p className="text-sm text-muted-foreground">{theme?.name}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          {/* TTS Button */}
                          {tts.isSupported && (settings?.tts_enabled ?? true) && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => isPlaying ? handleStopViz() : handlePlayViz(viz)}
                              title={isPlaying ? "Parar" : "Ouvir"}
                            >
                              <Volume2 className={`h-4 w-4 ${isPlaying ? 'text-primary animate-pulse' : ''}`} />
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => handleEditViz(viz)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{viz.duration_min}min</span>
                        <span className="flex items-center gap-1"><Zap className="h-3 w-3" />{viz.energy_min}-{viz.energy_max}</span>
                        <span>Uso: {usageCount}x</span>
                        {viz.last_used_at && <span>Último: {new Date(viz.last_used_at).toLocaleDateString('pt-BR')}</span>}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {viz.tags?.map((tag) => <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>)}
                      </div>
                      
                      {/* Show TTS controls when playing */}
                      {isPlaying && (
                        <div className="pt-2">
                          <TTSControls
                            isSpeaking={tts.isSpeaking}
                            isPaused={tts.isPaused}
                            isSupported={tts.isSupported}
                            isEnabled={settings?.tts_enabled ?? true}
                            onPlay={() => handlePlayViz(viz)}
                            onTogglePause={tts.togglePause}
                            onStop={handleStopViz}
                            onSkipEndSilence={tts.skipEndSilence}
                            isInEndSilence={tts.isInEndSilence}
                            endSilenceRemainingMs={tts.endSilenceRemainingMs}
                            compact
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Volume2, AlertCircle, Info, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSettings } from '@/hooks/useSettings';
import { useTTS, getVoiceDisplayName, DEFAULT_OUTRO_TEXT } from '@/hooks/useTTS';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { NotificationSettings } from '@/components/NotificationSettings';

export default function SettingsPage() {
  const { toast } = useToast();
  const { settings, updateSettings, isLoading } = useSettings();

  // General settings
  const [themeMode, setThemeMode] = useState<'auto' | 'manual'>('auto');
  const [noRepeatDays, setNoRepeatDays] = useState(14);
  const [preferredDuration, setPreferredDuration] = useState(4);
  const [themeLookbackDays, setThemeLookbackDays] = useState(14);

  // TTS Core settings
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [ttsRate, setTtsRate] = useState(0.62);
  const [ttsPreferFemale, setTtsPreferFemale] = useState(true);
  const [ttsVoiceUri, setTtsVoiceUri] = useState<string | null>(null);
  
  // TTS Micro-chunking pacing settings
  const [ttsPauseBaseMs, setTtsPauseBaseMs] = useState(220);
  const [ttsPausePerWordMs, setTtsPausePerWordMs] = useState(65);
  const [ttsPauseSentenceExtraMs, setTtsPauseSentenceExtraMs] = useState(450);
  const [ttsPauseParagraphExtraMs, setTtsPauseParagraphExtraMs] = useState(900);
  const [ttsBreathPauseMs, setTtsBreathPauseMs] = useState(1700);
  const [ttsMicrochunkMinWords, setTtsMicrochunkMinWords] = useState(8);
  const [ttsMicrochunkMaxWords, setTtsMicrochunkMaxWords] = useState(14);
  const [ttsEndSilenceMs, setTtsEndSilenceMs] = useState(30000);
  
  // TTS Outro settings
  const [ttsOutroEnabled, setTtsOutroEnabled] = useState(true);
  const [ttsOutroText, setTtsOutroText] = useState(DEFAULT_OUTRO_TEXT);

  // TTS hook for voice list
  const tts = useTTS({
    settings: {
      tts_enabled: ttsEnabled,
      tts_rate: ttsRate,
      tts_prefer_female: ttsPreferFemale,
      tts_voice_uri: ttsVoiceUri,
      tts_pause_base_ms: ttsPauseBaseMs,
      tts_pause_per_word_ms: ttsPausePerWordMs,
      tts_pause_sentence_extra_ms: ttsPauseSentenceExtraMs,
      tts_pause_paragraph_extra_ms: ttsPauseParagraphExtraMs,
      tts_breath_pause_ms: ttsBreathPauseMs,
      tts_microchunk_min_words: ttsMicrochunkMinWords,
      tts_microchunk_max_words: ttsMicrochunkMaxWords,
      tts_end_silence_ms: ttsEndSilenceMs,
      tts_outro_enabled: ttsOutroEnabled,
      tts_outro_text: ttsOutroText,
    },
  });

  useEffect(() => {
    if (settings) {
      setThemeMode(settings.default_theme_mode);
      setNoRepeatDays(settings.no_repeat_days);
      setPreferredDuration(settings.preferred_duration_min);
      setThemeLookbackDays(settings.theme_lookback_days);
      setTtsEnabled(settings.tts_enabled);
      setTtsRate(settings.tts_rate ?? 0.62);
      setTtsPreferFemale(settings.tts_prefer_female);
      setTtsVoiceUri(settings.tts_voice_uri);
      setTtsPauseBaseMs(settings.tts_pause_base_ms ?? 220);
      setTtsPausePerWordMs(settings.tts_pause_per_word_ms ?? 65);
      setTtsPauseSentenceExtraMs(settings.tts_pause_sentence_extra_ms ?? 450);
      setTtsPauseParagraphExtraMs(settings.tts_pause_paragraph_extra_ms ?? 900);
      setTtsBreathPauseMs(settings.tts_breath_pause_ms ?? 1700);
      setTtsMicrochunkMinWords(settings.tts_microchunk_min_words ?? 8);
      setTtsMicrochunkMaxWords(settings.tts_microchunk_max_words ?? 14);
      setTtsEndSilenceMs(settings.tts_end_silence_ms ?? 30000);
      setTtsOutroEnabled(settings.tts_outro_enabled ?? true);
      setTtsOutroText(settings.tts_outro_text ?? DEFAULT_OUTRO_TEXT);
    }
  }, [settings]);

  const handleSave = async () => {
    await updateSettings.mutateAsync({
      default_theme_mode: themeMode,
      no_repeat_days: noRepeatDays,
      preferred_duration_min: preferredDuration,
      theme_lookback_days: themeLookbackDays,
      tts_enabled: ttsEnabled,
      tts_rate: ttsRate,
      tts_prefer_female: ttsPreferFemale,
      tts_voice_uri: ttsVoiceUri,
      tts_pause_base_ms: ttsPauseBaseMs,
      tts_pause_per_word_ms: ttsPausePerWordMs,
      tts_pause_sentence_extra_ms: ttsPauseSentenceExtraMs,
      tts_pause_paragraph_extra_ms: ttsPauseParagraphExtraMs,
      tts_breath_pause_ms: ttsBreathPauseMs,
      tts_microchunk_min_words: ttsMicrochunkMinWords,
      tts_microchunk_max_words: ttsMicrochunkMaxWords,
      tts_end_silence_ms: ttsEndSilenceMs,
      tts_outro_enabled: ttsOutroEnabled,
      tts_outro_text: ttsOutroText,
    });
    
    toast({ title: 'Configurações salvas!' });
  };

  const handleRestoreOutroDefault = () => {
    setTtsOutroText(DEFAULT_OUTRO_TEXT);
    toast({ title: 'Texto do encerramento restaurado' });
  };

  const handleTestVoice = () => {
    if (tts.isSupported && ttsEnabled) {
      tts.speak('Testando a voz selecionada para o modo meditação. Respire fundo... e relaxe.', 'Teste');
    }
  };

  // Get Portuguese voices prioritized
  const sortedVoices = [...tts.voices].sort((a, b) => {
    const aIsPt = a.lang.toLowerCase().startsWith('pt');
    const bIsPt = b.lang.toLowerCase().startsWith('pt');
    if (aIsPt && !bIsPt) return -1;
    if (!aIsPt && bIsPt) return 1;
    return a.name.localeCompare(b.name);
  });

  const endSilenceSeconds = ttsEndSilenceMs / 1000;

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto">
          <p className="text-center text-muted-foreground">Carregando...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <h2 className="text-2xl font-semibold">Configurações</h2>

        {/* Notification Settings */}
        <NotificationSettings />

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Seleção Automática</CardTitle>
            <CardDescription>Configurações para a seleção automática de temas e visualizações</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Modo de seleção de tema</Label>
              <Select value={themeMode} onValueChange={(v) => setThemeMode(v as 'auto' | 'manual')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Automático</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                No modo automático, o sistema sugere o tema menos usado nos últimos dias
              </p>
            </div>

            <div className="space-y-2">
              <Label>Dias para lookback de tema</Label>
              <Input 
                type="number" 
                value={themeLookbackDays} 
                onChange={(e) => setThemeLookbackDays(+e.target.value)}
                min={1}
                max={90}
              />
              <p className="text-xs text-muted-foreground">
                Quantos dias considerar para calcular o tema menos usado
              </p>
            </div>

            <div className="space-y-2">
              <Label>Dias anti-repetição</Label>
              <Input 
                type="number" 
                value={noRepeatDays} 
                onChange={(e) => setNoRepeatDays(+e.target.value)}
                min={1}
                max={90}
              />
              <p className="text-xs text-muted-foreground">
                Evitar repetir visualizações usadas nos últimos N dias
              </p>
            </div>

            <div className="space-y-2">
              <Label>Duração preferida (minutos)</Label>
              <Input 
                type="number" 
                value={preferredDuration} 
                onChange={(e) => setPreferredDuration(+e.target.value)}
                min={1}
                max={30}
              />
              <p className="text-xs text-muted-foreground">
                Duração preferida para visualizações
              </p>
            </div>
          </CardContent>
        </Card>

        {/* TTS Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Volume2 className="h-5 w-5" />
              Áudio (Meditação)
            </CardTitle>
            <CardDescription>
              Pacing por micro-chunks para cadência meditativa natural
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!tts.isSupported ? (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <p className="text-sm">Seu navegador não suporta TTS nativo.</p>
              </div>
            ) : (
              <>
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    As vozes disponíveis dependem do seu dispositivo/navegador.
                  </AlertDescription>
                </Alert>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="tts-enabled">Habilitar TTS</Label>
                    <p className="text-xs text-muted-foreground">
                      Ativa os controles de áudio nas visualizações
                    </p>
                  </div>
                  <Switch
                    id="tts-enabled"
                    checked={ttsEnabled}
                    onCheckedChange={setTtsEnabled}
                  />
                </div>

                {ttsEnabled && (
                  <>
                    {/* Voice Selection */}
                    <div className="space-y-4 border-t pt-4">
                      <h4 className="text-sm font-medium">Voz</h4>
                      
                      <div className="space-y-2">
                        <Label>Selecionar voz</Label>
                        <Select 
                          value={ttsVoiceUri || 'auto'} 
                          onValueChange={(v) => setTtsVoiceUri(v === 'auto' ? null : v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Automático (melhor pt-BR)" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px]">
                            <SelectItem value="auto">Automático (melhor pt-BR)</SelectItem>
                            {sortedVoices.map((voice) => (
                              <SelectItem key={voice.voiceURI} value={voice.voiceURI}>
                                {getVoiceDisplayName(voice)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label htmlFor="tts-prefer-female">Preferir voz feminina</Label>
                          <p className="text-xs text-muted-foreground">
                            Quando disponível e no modo automático
                          </p>
                        </div>
                        <Switch
                          id="tts-prefer-female"
                          checked={ttsPreferFemale}
                          onCheckedChange={setTtsPreferFemale}
                          disabled={ttsVoiceUri !== null}
                        />
                      </div>
                    </div>

                    {/* Speed */}
                    <div className="space-y-4 border-t pt-4">
                      <h4 className="text-sm font-medium">Velocidade</h4>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label>Velocidade da fala</Label>
                          <span className="text-sm font-medium">{ttsRate.toFixed(2)}x</span>
                        </div>
                        <Slider
                          value={[ttsRate]}
                          onValueChange={([v]) => setTtsRate(v)}
                          min={0.55}
                          max={0.85}
                          step={0.01}
                          className="py-2"
                        />
                        <p className="text-xs text-muted-foreground">
                          Mais lento (0.55) → Normal (0.85). Padrão meditação: 0.62
                        </p>
                      </div>
                    </div>

                    {/* Micro-chunk Pacing */}
                    <div className="space-y-4 border-t pt-4">
                      <h4 className="text-sm font-medium">Pacing por Micro-chunks</h4>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label>Pausa base entre chunks</Label>
                          <span className="text-sm font-medium">{ttsPauseBaseMs}ms</span>
                        </div>
                        <Slider
                          value={[ttsPauseBaseMs]}
                          onValueChange={([v]) => setTtsPauseBaseMs(v)}
                          min={0}
                          max={600}
                          step={20}
                          className="py-2"
                        />
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label>Pausa adicional por palavra</Label>
                          <span className="text-sm font-medium">{ttsPausePerWordMs}ms</span>
                        </div>
                        <Slider
                          value={[ttsPausePerWordMs]}
                          onValueChange={([v]) => setTtsPausePerWordMs(v)}
                          min={20}
                          max={140}
                          step={5}
                          className="py-2"
                        />
                        <p className="text-xs text-muted-foreground">
                          Quanto mais palavras no chunk, maior a pausa
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label>Extra por frase (. ! ?)</Label>
                          <span className="text-sm font-medium">{ttsPauseSentenceExtraMs}ms</span>
                        </div>
                        <Slider
                          value={[ttsPauseSentenceExtraMs]}
                          onValueChange={([v]) => setTtsPauseSentenceExtraMs(v)}
                          min={0}
                          max={1200}
                          step={50}
                          className="py-2"
                        />
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label>Extra por parágrafo</Label>
                          <span className="text-sm font-medium">{ttsPauseParagraphExtraMs}ms</span>
                        </div>
                        <Slider
                          value={[ttsPauseParagraphExtraMs]}
                          onValueChange={([v]) => setTtsPauseParagraphExtraMs(v)}
                          min={0}
                          max={2500}
                          step={100}
                          className="py-2"
                        />
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label>Pausa de respiração</Label>
                          <span className="text-sm font-medium">{(ttsBreathPauseMs / 1000).toFixed(1)}s</span>
                        </div>
                        <Slider
                          value={[ttsBreathPauseMs]}
                          onValueChange={([v]) => setTtsBreathPauseMs(v)}
                          min={800}
                          max={4000}
                          step={100}
                          className="py-2"
                        />
                        <p className="text-xs text-muted-foreground">
                          Usada nas 3 respirações iniciais da meditação
                        </p>
                      </div>
                    </div>

                    {/* Chunk Size */}
                    <div className="space-y-4 border-t pt-4">
                      <h4 className="text-sm font-medium">Tamanho dos Micro-chunks</h4>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Mínimo de palavras</Label>
                          <Input 
                            type="number" 
                            value={ttsMicrochunkMinWords} 
                            onChange={(e) => setTtsMicrochunkMinWords(Math.max(3, Math.min(+e.target.value, ttsMicrochunkMaxWords - 1)))}
                            min={3}
                            max={20}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Máximo de palavras</Label>
                          <Input 
                            type="number" 
                            value={ttsMicrochunkMaxWords} 
                            onChange={(e) => setTtsMicrochunkMaxWords(Math.max(ttsMicrochunkMinWords + 1, Math.min(+e.target.value, 25)))}
                            min={5}
                            max={25}
                          />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Chunks menores = mais pausas, ritmo mais meditativo
                      </p>
                    </div>

                    {/* Outro (Guided Closing) */}
                    <div className="space-y-4 border-t pt-4">
                      <h4 className="text-sm font-medium">Encerramento Guiado (Outro)</h4>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label htmlFor="tts-outro-enabled">Encerramento guiado</Label>
                          <p className="text-xs text-muted-foreground">
                            Falar texto de encerramento antes do silêncio final
                          </p>
                        </div>
                        <Switch
                          id="tts-outro-enabled"
                          checked={ttsOutroEnabled}
                          onCheckedChange={setTtsOutroEnabled}
                        />
                      </div>
                      
                      {ttsOutroEnabled && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label>Texto do encerramento</Label>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={handleRestoreOutroDefault}
                              className="h-7 text-xs"
                            >
                              <RotateCcw className="h-3 w-3 mr-1" />
                              Restaurar padrão
                            </Button>
                          </div>
                          <Textarea 
                            rows={6} 
                            value={ttsOutroText} 
                            onChange={(e) => setTtsOutroText(e.target.value)}
                            className="text-sm"
                          />
                        </div>
                      )}
                      
                      <Alert variant="default" className="bg-muted/50">
                        <Info className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          No iPhone, pausas dependem do navegador; o encerramento guiado reduz a sensação de travamento.
                        </AlertDescription>
                      </Alert>
                    </div>

                    {/* End Silence */}
                    <div className="space-y-4 border-t pt-4">
                      <h4 className="text-sm font-medium">Silêncio Final</h4>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label>Silêncio final</Label>
                          <span className="text-sm font-medium">{endSilenceSeconds}s</span>
                        </div>
                        <Slider
                          value={[ttsEndSilenceMs]}
                          onValueChange={([v]) => setTtsEndSilenceMs(v)}
                          min={0}
                          max={60000}
                          step={5000}
                          className="py-2"
                        />
                        <p className="text-xs text-muted-foreground">
                          Período de silêncio após o encerramento (com contador visível)
                        </p>
                      </div>
                    </div>

                    <Button 
                      variant="outline" 
                      onClick={handleTestVoice}
                      className="w-full"
                      disabled={tts.isSpeaking}
                    >
                      <Volume2 className="h-4 w-4 mr-2" />
                      {tts.isSpeaking ? 'Falando...' : 'Testar Voz'}
                    </Button>
                  </>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Button onClick={handleSave} className="w-full">
          Salvar Configurações
        </Button>
      </div>
    </Layout>
  );
}

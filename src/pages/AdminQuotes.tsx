import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, AlertTriangle, BarChart3 } from 'lucide-react';
import { useQuotes, useQuoteStats, useCreateQuote, useUpdateQuote, useDeleteQuote, Quote } from '@/hooks/useQuotes';
import { useThemes } from '@/hooks/useThemes';
import { useToast } from '@/hooks/use-toast';

const SOURCE_TYPES = [
  { value: 'person', label: 'Pessoa' },
  { value: 'anonymous', label: 'Anônimo' },
  { value: 'book', label: 'Livro' },
  { value: 'proverb', label: 'Provérbio' },
  { value: 'other', label: 'Outro' },
];

const LANGUAGES = [
  { value: 'pt-BR', label: 'Português (BR)' },
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
];

interface QuoteFormData {
  language: string;
  theme_id: string | null;
  quote_text: string;
  author: string;
  source: string;
  source_type: 'person' | 'anonymous' | 'book' | 'proverb' | 'other';
  is_active: boolean;
}

const emptyForm: QuoteFormData = {
  language: 'pt-BR',
  theme_id: null,
  quote_text: '',
  author: '',
  source: '',
  source_type: 'person',
  is_active: true,
};

export default function AdminQuotes() {
  const { toast } = useToast();
  const { themes } = useThemes();
  const [filterLanguage, setFilterLanguage] = useState('pt-BR');
  const [filterTheme, setFilterTheme] = useState<string>('all');
  const { data: quotes, isLoading } = useQuotes(
    filterLanguage || undefined,
    filterTheme === 'all' ? undefined : filterTheme === 'general' ? null : filterTheme
  );
  const { data: stats } = useQuoteStats();
  
  const createQuote = useCreateQuote();
  const updateQuote = useUpdateQuote();
  const deleteQuote = useDeleteQuote();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [form, setForm] = useState<QuoteFormData>(emptyForm);

  const charCount = form.quote_text.length;
  const isOverLimit = charCount > 240;
  const isBookWarning = form.source_type === 'book' && charCount > 200;

  const handleOpenCreate = () => {
    setEditingQuote(null);
    setForm(emptyForm);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (quote: Quote) => {
    setEditingQuote(quote);
    setForm({
      language: quote.language,
      theme_id: quote.theme_id,
      quote_text: quote.quote_text,
      author: quote.author || '',
      source: quote.source || '',
      source_type: quote.source_type,
      is_active: quote.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.quote_text.trim()) {
      toast({ title: 'Erro', description: 'Citação é obrigatória', variant: 'destructive' });
      return;
    }
    if (isOverLimit) {
      toast({ title: 'Erro', description: 'Citação excede 240 caracteres', variant: 'destructive' });
      return;
    }

    try {
      const data = {
        language: form.language,
        theme_id: form.theme_id || null,
        quote_text: form.quote_text.trim(),
        author: form.author.trim() || null,
        source: form.source.trim() || null,
        source_type: form.source_type,
        is_active: form.is_active,
      };

      if (editingQuote) {
        await updateQuote.mutateAsync({ id: editingQuote.id, ...data });
        toast({ title: 'Atualizado', description: 'Citação atualizada com sucesso' });
      } else {
        await createQuote.mutateAsync(data);
        toast({ title: 'Criado', description: 'Citação criada com sucesso' });
      }
      setIsDialogOpen(false);
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Desativar esta citação?')) return;
    try {
      await deleteQuote.mutateAsync(id);
      toast({ title: 'Desativado', description: 'Citação desativada' });
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Gerenciar Citações</h2>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleOpenCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Citação
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingQuote ? 'Editar Citação' : 'Nova Citação'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Idioma</Label>
                    <Select value={form.language} onValueChange={(v) => setForm({ ...form, language: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LANGUAGES.map((l) => (
                          <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Tema</Label>
                    <Select 
                      value={form.theme_id || 'general'} 
                      onValueChange={(v) => setForm({ ...form, theme_id: v === 'general' ? null : v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">Geral (fallback)</SelectItem>
                        {themes.map((t) => (
                          <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Citação</Label>
                    <span className={`text-xs ${isOverLimit ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {charCount}/240
                    </span>
                  </div>
                  <Textarea
                    value={form.quote_text}
                    onChange={(e) => setForm({ ...form, quote_text: e.target.value })}
                    placeholder="A citação inspiracional..."
                    rows={3}
                    className={isOverLimit ? 'border-destructive' : ''}
                  />
                  {isBookWarning && (
                    <p className="text-xs text-amber-600 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Citação de livro acima de 200 chars - considere parafrasear
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Autor</Label>
                    <Input
                      value={form.author}
                      onChange={(e) => setForm({ ...form, author: e.target.value })}
                      placeholder="Sêneca, Anônimo..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select 
                      value={form.source_type} 
                      onValueChange={(v) => setForm({ ...form, source_type: v as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SOURCE_TYPES.map((s) => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Fonte (opcional, max 120 chars)</Label>
                  <Input
                    value={form.source}
                    onChange={(e) => setForm({ ...form, source: e.target.value.slice(0, 120) })}
                    placeholder="Cartas a Lucílio, Meditações..."
                  />
                </div>

                <div className="flex items-center gap-3">
                  <Switch
                    checked={form.is_active}
                    onCheckedChange={(v) => setForm({ ...form, is_active: v })}
                  />
                  <Label>Ativa</Label>
                </div>

                <Button onClick={handleSubmit} className="w-full" disabled={isOverLimit}>
                  {editingQuote ? 'Salvar' : 'Criar'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Estatísticas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Por Idioma</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {stats?.byLanguage && Object.entries(stats.byLanguage).map(([lang, count]) => (
                    <Badge key={lang} variant="secondary">{lang}: {count}</Badge>
                  ))}
                </div>
              </div>
              <div className="col-span-3">
                <p className="text-sm text-muted-foreground">Por Tema (ativas)</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {stats?.byTheme && Object.entries(stats.byTheme).map(([id, { count, name }]) => (
                    <Badge key={id} variant="outline">{name}: {count}</Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <div className="flex gap-4">
          <Select value={filterLanguage} onValueChange={setFilterLanguage}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Idioma" />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((l) => (
                <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterTheme} onValueChange={setFilterTheme}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Tema" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="general">Geral (fallback)</SelectItem>
              {themes.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">Citação</TableHead>
                  <TableHead>Autor</TableHead>
                  <TableHead>Tema</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-20">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : quotes?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Nenhuma citação encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  quotes?.map((quote) => (
                    <TableRow key={quote.id} className={!quote.is_active ? 'opacity-50' : ''}>
                      <TableCell>
                        <p className="text-sm line-clamp-2">"{quote.quote_text}"</p>
                        {quote.source && (
                          <p className="text-xs text-muted-foreground mt-1">— {quote.source}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{quote.author || 'Anônimo'}</span>
                        <Badge variant="outline" className="ml-2 text-xs">
                          {SOURCE_TYPES.find((s) => s.value === quote.source_type)?.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {quote.theme?.name || 'Geral'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={quote.is_active ? 'default' : 'outline'}>
                          {quote.is_active ? 'Ativa' : 'Inativa'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => handleOpenEdit(quote)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDelete(quote.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

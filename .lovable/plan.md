

# Plano: Importar Biblioteca de Temas e Visualizações

## Objetivo
Restaurar completamente a biblioteca de meditações guiadas do projeto original, incluindo temas, visualizações, citações e configurações de TTS.

---

## O que será importado

### 📚 Temas (20 itens)
| Tema | Descrição |
|------|-----------|
| Abundância | Mentalidade de possibilidades |
| Aceitação | Ver a realidade como ela é |
| Autocompaixão | Firmeza sem crueldade |
| Clareza | Visão nítida dos objetivos |
| Coragem | Agir apesar do medo |
| Desapego | Soltar o controle |
| Disciplina | Manter consistência |
| Energia | Vitalidade e movimento |
| Fluidez | Adaptar-se com leveza |
| Foco | Atenção com intenção |
| Gratidão | Valorizar o que há de bom |
| Integridade | Coerência e verdade |
| Intuição | Escutar corpo e mente |
| Paciência | Construir no tempo certo |
| Paz Interior | Estabilidade emocional |
| Presença | Estar no momento |
| Prioridade | Escolher o que importa |
| Rendição | Confiar no processo |
| Silêncio | Clareza real |
| Verdade | Agir com lucidez |

### 🧘 Visualizações (51 meditações ativas)
- 3 visualizações por tema
- Scripts completos para TTS
- Duração, energia e tags configurados

### 💬 Citações (95+ quotes)
- 5 citações por tema (aproximadamente)
- Autores e tipos catalogados

### ⚙️ Configurações TTS
- Parâmetros de velocidade e pausas
- Texto de outro (fechamento)

---

## Etapas da implementação

### Etapa 1: Ajustar permissões do banco
Adicionar políticas RLS para permitir inserção nas tabelas `themes`, `visualizations` e `quotes` (temporariamente ou via migration com privilégios)

### Etapa 2: Importar Temas
Executar SQL para inserir os 20 temas com seus IDs originais (mantendo referências)

### Etapa 3: Importar Visualizações
Executar SQL para inserir as 51 visualizações ativas com scripts completos

### Etapa 4: Importar Citações
Executar SQL para inserir as 95+ citações vinculadas aos temas

### Etapa 5: Atualizar Settings (opcional)
Configurar parâmetros de TTS conforme exportação, se necessário

---

## Resultado esperado
✅ Biblioteca completa restaurada na página `/library`
✅ Meditações disponíveis com TTS funcionando
✅ Citações do dia funcionando por tema
✅ Todos os 20 temas visíveis e selecionáveis


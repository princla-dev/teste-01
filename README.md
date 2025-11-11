# Audio Collector

Extensão Chrome (Manifest V3) que localiza todos os áudios disponíveis em uma página, une-os em um único arquivo WAV para download e registra cada operação em uma tabela do Supabase.

> **Nota:** O projeto já vem configurado com o Supabase informado (`https://petvbrlseijabedxaspz.supabase.co`). Você pode alterar as credenciais a qualquer momento na página de opções da extensão.

### Credenciais públicas incluídas

| Chave                | Valor |
|----------------------|-------|
| **Project URL**      | `https://petvbrlseijabedxaspz.supabase.co` |
| **Anon public key**  | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBldHZicmxzZWlqYWJlZHhhc3B6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NjIxNzYsImV4cCI6MjA3ODQzODE3Nn0.bRIv13iu82ukhzY7g5X55oDRiUcGVg0tqcNUvd135xg` |

Esses valores também são aplicados automaticamente no armazenamento interno da extensão durante a instalação, evitando alterações manuais em arquivos rastreados pelo Git e conflitos em pull requests.

## Estrutura do projeto

```
├── background.js             # Service worker responsável por baixar os áudios
├── content-script.js         # Captura os elementos de áudio no DOM
├── lib/
│   ├── audio.js              # Utilitários de conversão e união de áudios
│   ├── configDefaults.js     # Valores padrão das credenciais públicas (anon key)
│   ├── settings.js           # Persistência da configuração no chrome.storage
│   └── supabaseClient.js     # Funções para registrar downloads no Supabase via REST
├── manifest.json             # Manifesto da extensão (MV3)
├── options/
│   ├── options.css           # Estilos da página de configuração
│   ├── options.html          # Formulário de edição das credenciais
│   └── options.js            # Lógica para carregar/salvar as configurações
├── popup/
│   ├── popup.css             # Estilos da interface do popup
│   ├── popup.html            # Interface principal exibida no popup
│   └── popup.js              # Lógica para orquestrar a coleta, união e registro
└── README.md
```

## Pré-requisitos

1. **Projeto Supabase:**
   - Crie uma tabela `download_logs` com a seguinte definição mínima:

     | coluna             | tipo          | detalhes                                      |
     |--------------------|---------------|-----------------------------------------------|
     | `id`               | `uuid`        | chave primária (default `gen_random_uuid()`)  |
     | `page_url`         | `text`        | URL da página onde o áudio foi coletado       |
     | `file_name`        | `text`        | Nome do arquivo gerado                        |
     | `audio_count`      | `int4`        | Quantidade de áudios agrupados                |
     | `duration_seconds` | `float8`      | Duração total (segundos)                      |
     | `source_urls`      | `jsonb`       | Lista de URLs usadas na união                 |
     | `downloaded_at`    | `timestamptz` | Timestamp do registro                         |

   - Garanta permissão de inserção para a `anon key` na tabela.

2. **Configuração local:**
   - Após carregar a extensão, acesse **Detalhes → Opções da extensão** para ver e, se quiser, substituir as credenciais do Supabase.
   - Caso não configure o Supabase (ou remova os valores), o download continuará funcionando, mas o registro será ignorado e um aviso aparecerá no console.

## Como testar a extensão

1. Abra `chrome://extensions/` e habilite o **Modo do desenvolvedor**.
2. Clique em **Carregar sem compactação** e selecione a pasta deste repositório.
3. Opcional: abra as **Opções** da extensão para confirmar ou alterar as credenciais do Supabase.
4. Acesse uma página que contenha elementos `<audio>` ou `<source type="audio/...">` com URLs acessíveis.
5. Abra o popup da extensão e clique em **“Unir e baixar áudios”**.
6. Um arquivo `audios_unidos.wav` será baixado. Caso o Supabase esteja configurado, o evento ficará registrado na tabela `download_logs`.

## Limitações conhecidas

- Áudios servidos via URLs `blob:` ou streams dinâmicas não são capturados automaticamente. Será necessário adaptar o content script para interceptar `fetch`/`XHR` se o site trabalhar apenas com blobs em memória.
- Todos os áudios são convertidos para PCM 16-bit e exportados em WAV. Formatos e taxas de amostragem diferentes são normalizados pelo Web Audio API, mas podem introduzir pequenas variações na qualidade.
- Sites que exigem autenticação ou cabeçalhos específicos podem bloquear o download direto feito pelo service worker.

## Próximos passos sugeridos

- Adicionar tratamento para blobs e streams dinâmicas.
- Permitir exportar em outros formatos (MP3/OGG) usando `ffmpeg.wasm` ou serviços externos.
- Implementar feedback visual adicional (barra de progresso, lista dos arquivos encontrados etc.).

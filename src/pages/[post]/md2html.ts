import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'

const highlight = (str: string, lang: string): string => {
  let code = md.utils.escapeHtml(str)
  if (lang && hljs.getLanguage(lang)) {
    code = hljs.highlight(lang, str, true).value
  }
  return `<pre class="hljs"><code>${code}</code></pre>`
}

const md = new MarkdownIt({ highlight })

export default md

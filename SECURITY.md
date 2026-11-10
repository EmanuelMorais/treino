# Credenciais e repositório público

Nunca versionar palavras-passe, chaves SMTP/API administrativas, JWT de utilizador, exports pessoais ou ficheiros `.env` privados. `config.js` só recebe o URL e uma chave **publicável** Supabase, destinada ao navegador; nunca `secret` ou `service_role`. [Tipos de chave](https://supabase.com/docs/guides/getting-started/api-keys).

Para desenvolvimento:

```sh
npm run security:install
npm run security:scan
git config core.hooksPath .githooks
```

O instalador verifica SHA-256 fixado; o scanner não imprime valores encontrados. O hook verifica ficheiros/staging e o CI verifica também histórico/mensagens. Detetores automáticos reduzem o risco, mas não certificam ausência de toda a informação privada. Rever sempre os ficheiros e o diff antes de publicar.

Se uma credencial privada for exposta, revogá-la no fornecedor e substituir a credencial antes de limpar o histórico. Apagar apenas o ficheiro atual não remove cópias anteriores. Não colar credenciais em issues, PRs, logs ou capturas; usar um canal privado para reportar a exposição.

A [auditoria e evidência](docs/ENTREGA-SEGURANCA-E-CALENDARIO.md) identifica o alcance e os limites da verificação realizada.

import{C as e,S as t,h as n,m as r}from"./index-Bm7ndNhZ.js";import{t as i}from"./src-CGP2pcGM.js";var a=i(`section`)`
	width: 100%;
	max-width: 52rem;
	padding: 2rem;
	border: 2px solid #2b4638;
	border-radius: 0;
	background: #121816;
	box-shadow: 4px 4px 0 #050706;
	display: flex;
	gap: 30px;
	flex-direction: column;
	align-items: center;

	@media (max-width: 640px) {
		padding: 1.25rem;
	}
`,o=i(`h1`)`
	margin: 0 0 0.5rem;
	color: #e8b84e;
	font-size: clamp(1.6rem, 4vw, 2.25rem);
	letter-spacing: 0.04em;
	text-transform: uppercase;
`,s=i(`button`)`
	width: 100%;
	padding: 0.875rem 1.25rem;
	border: 2px solid #d9a441;
	border-radius: 0;
	background: #d9a441;
	box-shadow: 3px 3px 0 #6f4e0d;
	color: #17130c;
	font-size: 0.85rem;
	font-weight: 700;
	letter-spacing: 0.08em;
	text-transform: uppercase;
	cursor: pointer;
	transition: background 150ms ease, transform 150ms ease, box-shadow 150ms ease;

	&:hover {
		background: #edbd5a;
		box-shadow: 4px 4px 0 #6f4e0d;
		transform: translate(-1px, -1px);
	}

	&:disabled {
		cursor: wait;
		opacity: 0.6;
		transform: none;
	}
`,c=i(`button`)`
	width: 100%;
	margin-top: 0.75rem;
	padding: 0.875rem 1.25rem;
	border: 2px solid #4fc47b;
	border-radius: 0;
	background: #102319;
	box-shadow: 3px 3px 0 #1d5e3a;
	color: #70e0a0;
	font-size: 0.85rem;
	font-weight: 700;
	letter-spacing: 0.08em;
	text-transform: uppercase;
	cursor: pointer;
	transition: background 150ms ease, transform 150ms ease, box-shadow 150ms ease;

	&:hover {
		background: #163522;
		box-shadow: 4px 4px 0 #1d5e3a;
		transform: translate(-1px, -1px);
	}

	&:disabled {
		cursor: not-allowed;
		opacity: 0.45;
		transform: none;
	}
`,l=i(`label`)`
	display: block;
	margin: 1.5rem 0 0.5rem;
	color: #d7d4cc;
	font-size: 0.8rem;
	font-weight: 700;
	letter-spacing: 0.08em;
	text-transform: uppercase;
`,u=i(`textarea`)`
	width: 100%;
	min-height: 18rem;
	padding: 1rem;
	resize: none;
	border: 2px solid #2b4638;
	border-radius: 0;
	background: #0a0e0c;
	box-shadow: inset 0 0 0 1px rgb(217 164 65 / 8%);
	color: #d7d4cc;
	font: 0.875rem/1.6 "Courier New", ui-monospace, SFMono-Regular, Consolas, monospace;
	outline: none;

	&:focus,
	&:focus-visible {
		border-color: #526d5b;
		outline: none;
		box-shadow: inset 0 0 0 1px rgb(82 109 91 / 35%);
	}
`,d=i(`div`)`
	width: 100%;
	max-height: 0;
	overflow: hidden;
	opacity: 0;
	transform: translateY(-0.5rem);
	transition:
		max-height 420ms cubic-bezier(0.22, 1, 0.36, 1),
		opacity 180ms ease,
		transform 420ms cubic-bezier(0.22, 1, 0.36, 1);

	@media (prefers-reduced-motion: reduce) {
		max-height: none;
		opacity: 1;
		transform: none;
		transition: none;
	}
`,f=r=>{let i,a,o;return e(()=>{if(!i)return;let e=i.scrollHeight;i.offsetHeight,a=window.requestAnimationFrame(()=>{i&&(i.style.maxHeight=`${e}px`,i.style.opacity=`1`,i.style.transform=`translateY(0)`,o=window.setTimeout(()=>{i&&(i.style.maxHeight=`none`)},450))})}),t(()=>{a!==void 0&&window.cancelAnimationFrame(a),o!==void 0&&window.clearTimeout(o)}),n(d,{ref(e){var t=i;typeof t==`function`?t(e):i=e},get children(){return r.children}})},p=e=>n(a,{get children(){return[n(o,{children:`Importar Analyser`}),n(s,{type:`button`,get onClick(){return e.onReadClipboard},get disabled(){return e.readingClipboard},get children(){return e.readingClipboard?`Lendo clipboard...`:`Colar do clipboard`}}),n(r,{get when(){return e.clipboardText},get children(){return n(f,{get children(){return[n(l,{for:`hunt-analyser`,children:`Conteúdo capturado`}),n(u,{id:`hunt-analyser`,get value(){return e.clipboardText},readonly:!0}),n(c,{type:`button`,get onClick(){return e.onSave},get disabled(){return e.saving},get children(){return e.saving?`Salvando...`:`Salvar resultado`}})]}})}})]}});export{p as default};
import{m as e,p as t}from"./index-B3H4Ryps.js";import{t as n}from"./src-CQI4vSmd.js";import{a as r}from"./Icons-BaBmXxSv.js";var i=n(`div`)`
	position: fixed;
	inset: 0;
	z-index: 100;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 1rem;
	background: rgb(3 6 5 / 82%);
	backdrop-filter: blur(2px);
	animation: modal-backdrop-in 160ms ease-out;

	@keyframes modal-backdrop-in {
		from {
			opacity: 0;
		}

		to {
			opacity: 1;
		}
	}
`,a=n(`section`)`
	display: flex;
	align-items: center;
	flex-direction: column;
	width: min(100%, 30rem);
	padding: 1.5rem;
	border: 2px solid #b85a51;
	border-radius: 0;
	background: #121816;
	box-shadow: 6px 6px 0 #050706;
	animation: modal-dialog-in 180ms ease-out;

	@keyframes modal-dialog-in {
		from {
			opacity: 0;
			transform: translateY(-0.75rem);
		}

		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@media (max-width: 640px) {
		padding: 1.25rem;
	}
`,o=n(`div`)`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 2.75rem;
	height: 2.75rem;
	margin-bottom: 1rem;
	border: 2px solid #b85a51;
	border-radius: 0;
	background: #2b1514;
	color: #f08e83;
	font-size: 1.25rem;
	font-weight: 700;
`,s=n(`h2`)`
	margin: 0;
	color: #f4f1ea;
	font-size: 1.25rem;
	letter-spacing: 0.04em;
	text-transform: uppercase;
`,c=n(`p`)`
	margin: 0.75rem 0 1.5rem;
	color: #a5b2a7;
	font-size: 0.9rem;
	line-height: 1.6;
`,l=n(`div`)`
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 0.75rem;

	@media (max-width: 420px) {
		grid-template-columns: 1fr;
	}
`,u=n(`button`)`
	padding: 0.75rem 1rem;
	border: 2px solid;
	border-radius: 0;
	font-size: 0.8rem;
	font-weight: 700;
	letter-spacing: 0.06em;
	text-transform: uppercase;
	cursor: pointer;
	transition: background 150ms ease, color 150ms ease, transform 150ms ease;

	&:disabled {
		cursor: wait;
		opacity: 0.5;
		transform: none;
	}
`,d=n(u)`
	border-color: #526d5b;
	background: #101512;
	color: #b7c7ba;

	&:hover:not(:disabled) {
		background: #1a2b22;
		color: #f4f1ea;
		transform: translate(-1px, -1px);
	}
`,f=n(u)`
	border-color: #b85a51;
	background: #2b1514;
	color: #f08e83;

	&:hover:not(:disabled) {
		background: #4a1d1b;
		color: #ffc0b9;
		transform: translate(-1px, -1px);
	}
`,p=n=>{let u=e=>{!n.confirming&&e.target===e.currentTarget&&n.onCancel()};return e(t,{get when(){return n.open},get children(){return e(i,{onClick:u,get children(){return e(a,{role:`dialog`,"aria-modal":`true`,"aria-labelledby":`confirm-modal-title`,"aria-describedby":`confirm-modal-message`,get children(){return[e(o,{get children(){return e(r,{size:25})}}),e(s,{id:`confirm-modal-title`,get children(){return n.title}}),e(c,{id:`confirm-modal-message`,get children(){return n.message}}),e(l,{get children(){return[e(d,{type:`button`,get onClick(){return n.onCancel},get disabled(){return n.confirming},children:`Cancelar`}),e(f,{type:`button`,get onClick(){return n.onConfirm},get disabled(){return n.confirming},get children(){return n.confirming?`Excluindo...`:`Excluir caçada`}})]}})]}})}})}})};export{p as default};
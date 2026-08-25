import{S as e,_ as t,h as n,y as r}from"./index-CABvdcDK.js";import{t as i}from"./src-D_DsnFID.js";import{i as a}from"./Icons-D9GgIg3I.js";var o=i(`div`)`
	height: 100vh;
	min-height: 100dvh;
	display: flex;
	flex-direction: column;
	overflow: hidden;
	background-color: #0c100f;
	background-image:
		linear-gradient(rgb(93 150 104 / 4%) 1px, transparent 1px),
		linear-gradient(90deg, rgb(93 150 104 / 4%) 1px, transparent 1px);
	background-size: 4px 4px;
	color: #f4f1ea;
`,s=i(`header`)`
	flex: 0 0 auto;
	max-height: 10rem;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 1rem;
	padding: 0.65rem 1rem;
	background: #101512;
	border-bottom: 2px solid #284336;
	box-shadow: 0 3px 0 #070a09;
	overflow: hidden;
	z-index: 10;
	transform: translateY(0);
	opacity: 1;
	transition:
		max-height 260ms ease,
		padding 260ms ease,
		border-bottom-width 260ms ease,
		border-bottom-color 260ms ease,
		box-shadow 260ms ease,
		transform 260ms ease,
		opacity 180ms ease;

	&[data-visible="false"] {
		max-height: 0;
		padding-top: 0;
		padding-bottom: 0;
		border-bottom-width: 0;
		border-bottom-color: transparent;
		box-shadow: none;
		transform: translateY(-0.75rem);
		opacity: 0;
		pointer-events: none;
	}

	@media (max-width: 640px) {
		align-items: flex-start;
		flex-direction: column;
		padding: 0.65rem 0.75rem;
	}
`,c=i(`div`)`
	display: flex;
	align-items: center;
	gap: 0.55rem;
	font-size: 1rem;
	font-weight: 700;
	letter-spacing: 0.08em;
	text-transform: uppercase;
	color: #f4f1ea;
`,l=i(`span`)`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 2rem;
	height: 2rem;
	border: 2px solid #d9a441;
	border-radius: 0;
	background: #d9a441;
	box-shadow: 2px 2px 0 #6f4e0d;
	color: #17130c;
	font-size: 1rem;
	line-height: 0;
`,u=i(`nav`)`
	display: flex;
	gap: 0.35rem;

	@media (max-width: 640px) {
		width: 100%;
	}
`,d=i(`button`)`
	padding: 0.4rem 0.75rem;
	border: 1px solid transparent;
	border-radius: 0;
	background: transparent;
	color: #a5a8b2;
	font-size: 0.72rem;
	font-weight: 700;
	letter-spacing: 0.08em;
	text-transform: uppercase;
	cursor: pointer;
	transition: background 150ms ease, color 150ms ease, box-shadow 150ms ease;

	&[data-active="true"] {
		border-color: #d9a441;
		background: #d9a441;
		box-shadow: 2px 2px 0 #6f4e0d;
		color: #0c100f;
	}

	&:hover {
		border-color: #526d5b;
		background: #18231d;
		color: #f4f1ea;
	}

	@media (max-width: 640px) {
		flex: 1;
	}
`,f=i(`main`)`
	flex: 1;
	min-height: 0;
	display: flex;
	align-items: flex-start;
	justify-content: center;
	width: 100%;
	padding: 2rem 1rem 4rem;
	overflow-x: hidden;
	overflow-y: auto;
	scrollbar-gutter: stable;
`,p=i=>{let[p,m]=r(!0),h=0,g=!1,_,v=()=>{_!==void 0&&(window.clearTimeout(_),_=void 0)},y=e=>{p()!==e&&(m(e),g=!0,v(),_=window.setTimeout(()=>{g=!1,_=void 0},320))};t(()=>{i.view,h=0,g=!1,v(),m(!0)}),e(v);let b=e=>{let t=e.currentTarget.scrollTop,n=t-h;if(g){h=t,t<=4&&(g=!1,v(),m(!0));return}t<=4||n<-2?y(!0):n>2&&y(!1),h=t};return n(o,{get children(){return[n(s,{get"data-visible"(){return p()},get children(){return[n(c,{get children(){return[n(l,{get children(){return n(a,{size:22})}}),`Hunt Vault`]}}),n(u,{"aria-label":`Navegação principal`,get children(){return[n(d,{get"data-active"(){return i.view===`visualize`},type:`button`,onClick:()=>i.onViewChange(`visualize`),children:`Visualizar`}),n(d,{get"data-active"(){return i.view===`import`},type:`button`,onClick:()=>i.onViewChange(`import`),children:`Importar`})]}})]}}),n(f,{onScroll:b,get children(){return i.children}})]}})};export{p as default};
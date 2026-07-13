import{d as e,m as t,r as n,t as r}from"./jsx-runtime-CdD58A1P.js";import{f as i,l as a,n as o,p as s,s as c}from"./index.esm-DAkVgagw.js";import{r as l}from"./config-DlcurdR8.js";import{o as u}from"./index-D2Z6O5zA.js";var d=t(e(),1);function f(){let{currentUser:e}=u(),[t,n]=(0,d.useState)([]),[r,o]=(0,d.useState)(!0),[f,p]=(0,d.useState)(null);return(0,d.useEffect)(()=>{if(!e||!e.email){n([]),o(!1);return}return o(!0),c(a(s(l,`orders`),i(`customerEmail`,`==`,e.email)),e=>{let t=[];e.forEach(e=>{t.push({id:e.id,...e.data()})}),t.sort((e,t)=>{let n=e.createdAt?new Date(e.createdAt).getTime():0;return(t.createdAt?new Date(t.createdAt).getTime():0)-n}),n(t),o(!1),p(null)},e=>{console.error(`Error listening to orders:`,e),p(e),o(!1)})},[e]),{orders:t,loading:r,error:f}}var p=r();function m(){let{currentUser:e}=u(),{orders:t,loading:r,error:m}=f(),[h,g]=(0,d.useState)([]),[_,v]=(0,d.useState)(!1),[y,b]=(0,d.useState)({orderId:``,productId:``,productName:``}),[x,S]=(0,d.useState)(0),[C,w]=(0,d.useState)(``),[T,E]=(0,d.useState)(!1);(0,d.useEffect)(()=>{document.title=`Crazy Cloths — My Orders`},[]),(0,d.useEffect)(()=>{if(!e||!e.email){g([]);return}return c(a(s(l,`reviews`),i(`customerEmail`,`==`,e.email)),e=>{let t=[];e.forEach(e=>{t.push({id:e.id,...e.data()})}),g(t)},e=>{console.error(`Reviews snapshot listener error:`,e)})},[e]);let D=(e,t,n)=>{b({orderId:e,productId:t,productName:n}),S(0),w(``),v(!0)},O=()=>{v(!1)},k=async t=>{if(t.preventDefault(),x===0){alert(`Please select a star rating.`);return}E(!0);try{let t={productId:y.productId,orderId:y.orderId,rating:x,comment:C.trim(),customerName:e.displayName||e.email.split(`@`)[0],customerEmail:e.email,createdAt:new Date().toISOString()};await o(s(l,`reviews`),t),v(!1)}catch(e){console.error(`Failed to submit review:`,e),alert(`Failed to submit review: `+e.message)}finally{E(!1)}},A=e=>{let t=0,n=`active`,r=``,i=``,a=``;return e===`Confirmed`?(t=33.33,n=`done`,r=`active`):e===`Dispatched`?(t=66.66,n=`done`,r=`done`,i=`active`):e===`Delivered`&&(t=100,n=`done`,r=`done`,i=`done`,a=`active done`),{fillPct:t,step1:n,step2:r,step3:i,step4:a}};return(0,p.jsxs)(`main`,{style:{paddingTop:`var(--header-height)`,minHeight:`80vh`},children:[(0,p.jsx)(`style`,{children:`
        .order-tracking-card {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 8px;
          padding: var(--spacing-lg);
          margin-bottom: var(--spacing-lg);
          transition: border-color 0.3s ease, box-shadow 0.3s ease, transform 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .order-header-info {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 1rem;
          border-bottom: 1px solid var(--color-border);
          padding-bottom: var(--spacing-md);
          margin-bottom: var(--spacing-lg);
        }

        .order-meta-details {
          display: flex;
          gap: 2rem;
          flex-wrap: wrap;
        }

        .order-meta-item span {
          display: block;
          font-size: 0.75rem;
          color: var(--color-text-secondary);
          font-family: var(--font-mono);
          text-transform: uppercase;
        }
        .order-meta-item strong {
          font-size: 1rem;
          color: var(--color-text-primary);
        }

        .order-body-grid {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 2rem;
          align-items: center;
        }
        @media (max-width: 600px) {
          .order-body-grid {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }
        }

        .order-thumbnail {
          width: 90px;
          height: 90px;
          object-fit: cover;
          border-radius: 6px;
          background: var(--color-bg-2);
          border: 1px solid var(--color-border);
        }

        .timeline-wrapper {
          position: relative;
          padding: 1.5rem 0 0.5rem 0;
          margin-top: 1rem;
        }

        .timeline-line-bg {
          position: absolute;
          top: 50%;
          left: 0;
          width: 100%;
          height: 4px;
          background: var(--color-border-light);
          transform: translateY(-50%);
          z-index: 1;
          border-radius: 2px;
        }

        .timeline-line-fill {
          position: absolute;
          top: 50%;
          left: 0;
          height: 4px;
          background: var(--color-accent);
          transform: translateY(-50%);
          z-index: 2;
          border-radius: 2px;
          transition: width 0.8s cubic-bezier(0.25, 1, 0.5, 1);
        }

        .timeline-steps {
          display: flex;
          justify-content: space-between;
          position: relative;
          z-index: 3;
          width: 100%;
        }

        .timeline-node {
          display: flex;
          flex-direction: column;
          align-items: center;
          background: var(--color-surface);
          position: relative;
        }

        .timeline-dot {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--color-surface);
          border: 3px solid var(--color-border-light);
          transition: border-color 0.4s ease, background-color 0.4s ease, transform 0.4s ease;
        }

        .timeline-node.active .timeline-dot {
          border-color: var(--color-accent);
          background-color: var(--color-bg);
          transform: scale(1.2);
        }

        .timeline-node.done .timeline-dot {
          border-color: var(--color-accent);
          background-color: var(--color-accent);
        }

        .timeline-label {
          margin-top: 0.5rem;
          font-size: 0.75rem;
          font-family: var(--font-mono);
          text-transform: uppercase;
          color: var(--color-text-secondary);
          transition: color 0.4s ease;
          font-weight: 500;
        }

        .timeline-node.active .timeline-label,
        .timeline-node.done .timeline-label {
          color: var(--color-text-primary);
          font-weight: 700;
        }

        /* Modal Dialog */
        .review-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(8px);
          z-index: 2000;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.3s ease;
        }
        
        .review-modal-backdrop.active {
          opacity: 1;
          pointer-events: all;
        }

        .review-modal {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 8px;
          padding: 2.5rem;
          width: 100%;
          max-width: 480px;
          transform: scale(0.9);
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          position: relative;
        }

        .review-modal-backdrop.active .review-modal {
          transform: scale(1);
        }

        .review-modal-close {
          position: absolute;
          top: 1rem;
          right: 1rem;
          font-size: 2rem;
          line-height: 1;
          cursor: pointer;
          color: var(--color-text-secondary);
          background: transparent;
          border: none;
          transition: color 0.2s;
        }

        .review-modal-close:hover {
          color: var(--color-accent);
        }

        .star-rating-select {
          display: flex;
          gap: 0.5rem;
          margin: 1.5rem 0;
          justify-content: center;
        }

        .star-select-btn {
          font-size: 2.2rem;
          color: var(--color-text-muted);
          cursor: pointer;
          transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275), color 0.2s ease;
          background: none;
          border: none;
        }

        .star-select-btn:hover {
          transform: scale(1.3);
        }

        .star-select-btn.filled {
          color: #F59E0B;
          animation: starBounce 0.3s ease;
        }

        @keyframes starBounce {
          0% { transform: scale(1); }
          50% { transform: scale(1.4); }
          100% { transform: scale(1); }
        }
      `}),(0,p.jsx)(`section`,{className:`page-section`,children:(0,p.jsxs)(`div`,{className:`container`,style:{maxWidth:`900px`},children:[(0,p.jsx)(`h1`,{style:{fontFamily:`var(--font-display)`,fontSize:`3rem`,textTransform:`uppercase`,marginBottom:`2rem`,borderBottom:`2px solid var(--color-border)`,paddingBottom:`1rem`},children:`My Orders`}),m&&(0,p.jsxs)(`div`,{style:{textAlign:`center`,padding:`4rem 1rem`},children:[(0,p.jsx)(`h2`,{style:{fontFamily:`var(--font-display)`,fontSize:`1.8rem`,marginBottom:`1rem`,color:`var(--color-accent)`},children:`Failed to load orders`}),(0,p.jsx)(`p`,{style:{fontFamily:`var(--font-mono)`,fontSize:`0.85rem`,color:`var(--color-text-secondary)`,marginBottom:`2rem`},children:m.message||`Something went wrong while fetching your orders.`})]}),!m&&r&&(0,p.jsx)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:`1.5rem`},children:(0,p.jsx)(`div`,{className:`skeleton-card`,style:{height:`180px`,width:`100%`,background:`var(--color-surface)`,opacity:.5,borderRadius:`8px`}})}),!m&&!r&&t.length===0&&(0,p.jsxs)(`div`,{style:{textAlign:`center`,padding:`4rem 1rem`},children:[(0,p.jsx)(`h2`,{style:{fontFamily:`var(--font-display)`,fontSize:`2rem`,marginBottom:`1rem`,color:`var(--color-text-secondary)`},children:`You haven't placed an order yet`}),(0,p.jsx)(`p`,{style:{fontFamily:`var(--font-mono)`,fontSize:`0.9rem`,color:`var(--color-text-muted)`,marginBottom:`2rem`},children:`Explore our collection or design your own custom fit.`}),(0,p.jsx)(n,{to:`/collection`,className:`btn btn-accent`,style:{padding:`0.8rem 2rem`,textDecoration:`none`,display:`inline-block`},children:`Go to Shop`})]}),!m&&!r&&t.length>0&&(0,p.jsx)(`div`,{children:t.map(e=>{let t=e.orderId||e.id.slice(0,8),n=e.createdAt?new Date(e.createdAt).toLocaleDateString(`en-IN`,{day:`2-digit`,month:`short`,year:`numeric`}):`N/A`,r=e.status||`Pending`,i=A(r),a=h.some(t=>t.orderId===e.id);return(0,p.jsxs)(`div`,{className:`order-tracking-card`,children:[(0,p.jsxs)(`div`,{className:`order-header-info`,children:[(0,p.jsxs)(`div`,{className:`order-meta-details`,children:[(0,p.jsxs)(`div`,{className:`order-meta-item`,children:[(0,p.jsx)(`span`,{children:`Order Reference`}),(0,p.jsxs)(`strong`,{children:[`#CC-`,t]})]}),(0,p.jsxs)(`div`,{className:`order-meta-item`,children:[(0,p.jsx)(`span`,{children:`Date Placed`}),(0,p.jsx)(`strong`,{children:n})]}),(0,p.jsxs)(`div`,{className:`order-meta-item`,children:[(0,p.jsx)(`span`,{children:`Amount Total`}),(0,p.jsxs)(`strong`,{style:{color:`var(--color-accent)`},children:[`₹`,e.price||499]})]})]}),(0,p.jsx)(`span`,{className:`badge ${r.toLowerCase()}`,style:{padding:`0.4rem 0.8rem`,fontSize:`0.8rem`},children:r})]}),(0,p.jsxs)(`div`,{className:`order-body-grid`,children:[(0,p.jsxs)(`div`,{style:{display:`flex`,alignItems:`center`,gap:`1.5rem`},children:[(0,p.jsx)(`img`,{src:e.cloudinaryUrl||e.imageUrl||`/assets/images/white-t-shirt.png`,alt:e.productName||`Custom Fit`,className:`order-thumbnail`}),(0,p.jsxs)(`div`,{children:[(0,p.jsx)(`h3`,{style:{fontSize:`1.25rem`,textTransform:`uppercase`,marginBottom:`0.25rem`},children:e.productName||`Custom Fit T-Shirt`}),(0,p.jsxs)(`p`,{style:{fontFamily:`var(--font-mono)`,fontSize:`0.8rem`,color:`var(--color-text-secondary)`},children:[`Size: `,e.size||`Standard`,` \xA0·\xA0 Color: `,e.color||`white`,` \xA0·\xA0 Qty: `,e.quantity||1]})]})]}),(0,p.jsxs)(`div`,{className:`timeline-wrapper`,children:[(0,p.jsx)(`div`,{className:`timeline-line-bg`}),(0,p.jsx)(`div`,{className:`timeline-line-fill`,style:{width:`${i.fillPct}%`}}),(0,p.jsxs)(`div`,{className:`timeline-steps`,children:[(0,p.jsxs)(`div`,{className:`timeline-node ${i.step1}`,children:[(0,p.jsx)(`div`,{className:`timeline-dot`}),(0,p.jsx)(`div`,{className:`timeline-label`,children:`Placed`})]}),(0,p.jsxs)(`div`,{className:`timeline-node ${i.step2}`,children:[(0,p.jsx)(`div`,{className:`timeline-dot`}),(0,p.jsx)(`div`,{className:`timeline-label`,children:`Confirmed`})]}),(0,p.jsxs)(`div`,{className:`timeline-node ${i.step3}`,children:[(0,p.jsx)(`div`,{className:`timeline-dot`}),(0,p.jsx)(`div`,{className:`timeline-label`,children:`Dispatched`})]}),(0,p.jsxs)(`div`,{className:`timeline-node ${i.step4}`,children:[(0,p.jsx)(`div`,{className:`timeline-dot`}),(0,p.jsx)(`div`,{className:`timeline-label`,children:`Delivered`})]})]})]})]}),r===`Delivered`&&(0,p.jsx)(`div`,{style:{marginTop:`1rem`,display:`flex`,justifyContent:`flex-end`},children:a?(0,p.jsx)(`span`,{style:{fontFamily:`var(--font-mono)`,fontSize:`0.78rem`,color:`var(--color-success)`},children:`✓ Review submitted. Thank you!`}):(0,p.jsx)(`button`,{className:`btn btn-outline`,style:{padding:`0.4rem 1rem`,fontSize:`0.8rem`},onClick:()=>D(e.id,e.productId,e.productName||`Product`),children:`⭐ Leave a Review`})})]},e.id)})})]})}),(0,p.jsx)(`div`,{className:`review-modal-backdrop ${_?`active`:``}`,children:(0,p.jsxs)(`div`,{className:`review-modal`,children:[(0,p.jsx)(`button`,{className:`review-modal-close`,onClick:O,children:`×`}),(0,p.jsx)(`h3`,{style:{fontFamily:`var(--font-display)`,fontSize:`1.8rem`,textTransform:`uppercase`,marginBottom:`0.5rem`},children:`Leave a Review`}),(0,p.jsxs)(`p`,{style:{fontSize:`0.85rem`,color:`var(--color-text-secondary)`,marginBottom:`1.5rem`},children:[`For "`,y.productName,`"`]}),(0,p.jsxs)(`form`,{onSubmit:k,children:[(0,p.jsxs)(`div`,{style:{textAlign:`center`},children:[(0,p.jsx)(`span`,{style:{fontFamily:`var(--font-mono)`,fontSize:`0.8rem`,textTransform:`uppercase`,color:`var(--color-text-secondary)`},children:`Your Rating`}),(0,p.jsx)(`div`,{className:`star-rating-select`,children:[1,2,3,4,5].map(e=>(0,p.jsx)(`button`,{type:`button`,className:`star-select-btn ${x>=e?`filled`:``}`,onClick:()=>S(e),children:`★`},e))})]}),(0,p.jsxs)(`div`,{className:`form-group`,style:{marginTop:`1rem`},children:[(0,p.jsx)(`textarea`,{value:C,onChange:e=>w(e.target.value),className:`form-input`,rows:`3`,placeholder:` `,style:{resize:`vertical`}}),(0,p.jsx)(`label`,{className:`form-label`,children:`Review Comment (Optional)`})]}),(0,p.jsx)(`button`,{type:`submit`,disabled:T,className:`btn btn-accent btn-premium`,style:{width:`100%`,marginTop:`1.5rem`,padding:`0.8rem`},children:T?`Submitting...`:`Submit Review`})]})]})})]})}export{m as default};
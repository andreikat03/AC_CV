/* V0.5.2: three authentic DetailLane capabilities, represented as a schematic demo. */
(() => {
  'use strict';
  const stage = document.getElementById('detailDemoStage');
  const title = document.getElementById('detailDemoTitle');
  const tabs = [...document.querySelectorAll('[data-detail-view]')];
  if (!stage || !title || !tabs.length) return;
  const panels = {
    offers: {name: 'Oferte', steps: ['Servicii', 'Ofertă', 'PDF']},
    schedule: {name: 'Programări', steps: ['Calendar', 'Programare', 'Status']},
    clients: {name: 'Clienți', steps: ['Fișă client', 'Istoric', 'Recontactare']}
  };
  for (const tab of tabs) tab.addEventListener('click', () => {
    const selected = panels[tab.dataset.detailView];
    if (!selected) return;
    title.textContent = selected.name;
    stage.replaceChildren();
    const flow = document.createElement('div');flow.className = 'who-demo-workflow';
    selected.steps.forEach((step, i) => {
      if (i) {const arrow=document.createElement('b'); arrow.textContent='→';arrow.setAttribute('aria-hidden','true');flow.append(arrow);}
      const node=document.createElement('span');node.textContent=step;flow.append(node);
    });
    stage.append(flow);
    for (const size of ['', 'short', 'tiny']) {const line=document.createElement('div');line.className='who-demo-ghost-line '+size;line.setAttribute('aria-hidden','true');stage.append(line);}
    tabs.forEach(btn => {const active = btn===tab;btn.classList.toggle('is-selected',active);btn.setAttribute('aria-pressed',String(active));});
  });
})();

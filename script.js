/* scripts.js - Maria Cruz Modas
   - Pesquisa (match exato / parcial)
   - Filtro por categoria
   - Modal: abrir produto, adicionar ao carrinho sem fechar, toast estilizado
   - Finalizar no modal: 1º clique revela pagamento/endereço, 2º clique envia WhatsApp (mensagem limpa)
   - Carrinho salvo em localStorage (chave mc_cart_v1)
   - Badge do carrinho e integração com carrinho.html
*/

document.addEventListener('DOMContentLoaded', () => {
  const catButtons = document.querySelectorAll('.cat-btn');
  const produtos = Array.from(document.querySelectorAll('.produto'));
  const barraPesquisaInput = document.getElementById('search-input');
  const iconMenu = document.getElementById('icon-menu');
  const menuCategorias = document.getElementById('menu-categorias');

  const modal = document.getElementById("modal-produto");
  const modalImg = document.getElementById("modal-img");
  const modalNome = document.getElementById("modal-nome");
  const modalPreco = document.getElementById("modal-preco");
  const fechar = document.querySelector(".fechar");
  const btnFinalizar = document.getElementById("finalizar-pedido");
  const voltarHome = document.getElementById("voltar-home");
  const qtdInput = document.getElementById("qtd");
  const menosBtn = document.getElementById("menos");
  const maisBtn = document.getElementById("mais");
  const addCarrinhoBtn = document.getElementById("add-carrinho");
  const pagamentoDiv = document.querySelector('.pagamento');
  const enderecoDiv = document.querySelector('.endereco');

  const cartKey = 'mc_cart_v1';
  let cart = JSON.parse(localStorage.getItem(cartKey) || '[]');

  function salvarCarrinho() {
    localStorage.setItem(cartKey, JSON.stringify(cart));
  }
  function atualizarBadge() {
    const cartIconWrapper = document.querySelector('.icone-carrinho') || document.querySelector('.right-icons');
    if (!cartIconWrapper) return;
    let badge = cartIconWrapper.querySelector('.cart-badge');
    const totalItems = cart.reduce((s, i) => s + Number(i.quantidade), 0);
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'cart-badge';
      cartIconWrapper.appendChild(badge);
    }
    badge.textContent = totalItems;
  }

  function mostrarToast(msg) {
    const prev = document.querySelector('.mc-toast');
    if (prev) prev.remove();
    const toast = document.createElement('div');
    toast.className = 'mc-toast';
    toast.innerHTML = `<div class="mc-toast-inner">${msg}</div>`;
    document.body.appendChild(toast);
    setTimeout(() => { toast.remove(); }, 2800);
  }

  function normalizeText(str) {
    return str.replace(/\s+/g, ' ').trim().toLowerCase();
  }

  function filtrarProdutos(categoria = 'todos', termo = '') {
    termo = normalizeText(termo);
    const nomes = produtos.map(p => normalizeText(p.querySelector('.nome').textContent));
    const idxExato = termo !== '' ? nomes.findIndex(n => n === termo) : -1;

    produtos.forEach((prod, idx) => {
      const cat = (prod.getAttribute('data-category') || '').toLowerCase();
      const nome = nomes[idx];
      const matchCat = (categoria === 'todos') || (cat === categoria);
      let matchSearch = true;

      if (termo === '') {
        matchSearch = true;
      } else if (idxExato !== -1) {
        matchSearch = (idx === idxExato);
      } else {
        matchSearch = nome.includes(termo);
      }

      prod.style.display = (matchCat && matchSearch) ? '' : 'none';
    });
  }

  // categorias
  catButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      catButtons.forEach(b => b.classList.remove('ativo'));
      btn.classList.add('ativo');
      const cat = btn.getAttribute('data-cat') || 'todos';
      filtrarProdutos(cat, barraPesquisaInput ? barraPesquisaInput.value : '');
      if (window.innerWidth <= 600 && menuCategorias) menuCategorias.style.display = 'none';
    });
  });

  // pesquisa
  if (barraPesquisaInput) {
    barraPesquisaInput.addEventListener('input', e => {
      const termo = e.target.value || '';
      const active = document.querySelector('.cat-btn.ativo');
      const cat = active ? active.getAttribute('data-cat') : 'todos';
      filtrarProdutos(cat, termo);
    });
  }

  // mobile menu toggle
  if (iconMenu && menuCategorias) {
    iconMenu.addEventListener('click', () => {
      if (window.innerWidth <= 600) {
        menuCategorias.style.display = (menuCategorias.style.display === 'flex' || menuCategorias.style.display === '') ? 'none' : 'flex';
      } else {
        menuCategorias.style.display = 'flex';
      }
    });
  }

  // modal abrir
  let precoBase = 0;
  document.querySelectorAll('.produto .btn').forEach(btn => {
    btn.addEventListener('click', e => {
      const produto = e.target.closest('.produto');
      modalImg.src = produto.querySelector('img').src;
      modalNome.textContent = produto.querySelector('.nome').textContent;
      modalPreco.textContent = produto.querySelector('.preco').textContent;
      precoBase = parseFloat(produto.querySelector('.preco').textContent.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
      qtdInput.value = 1;
      if (pagamentoDiv) pagamentoDiv.style.display = 'none';
      if (enderecoDiv) enderecoDiv.style.display = 'none';
      if (btnFinalizar) { btnFinalizar.dataset.revealed = '0'; btnFinalizar.textContent = 'Finalizar Compra'; }
      modal.style.display = 'flex';
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    });
  });

  function fecharModal() {
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = 'auto';
  }
  if (fechar) fechar.onclick = fecharModal;
  if (voltarHome) voltarHome.onclick = () => { fecharModal(); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  window.addEventListener('click', e => { if (e.target === modal) fecharModal(); });

  // quantidade
  if (menosBtn) menosBtn.onclick = () => { if (qtdInput.value > 1) qtdInput.value--; atualizarPreco(); };
  if (maisBtn) maisBtn.onclick = () => { qtdInput.value++; atualizarPreco(); };
  function atualizarPreco() {
    const total = precoBase * Number(qtdInput.value || 1);
    modalPreco.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
  }

  // cor selecionada
  document.querySelectorAll('.cor').forEach(c => {
    c.addEventListener('click', () => {
      document.querySelectorAll('.cor').forEach(cor => cor.classList.remove('selecionada'));
      c.classList.add('selecionada');
    });
  });

  // adicionar ao carrinho (não fecha modal)
  addCarrinhoBtn.addEventListener('click', () => {
    const nome = modalNome.textContent;
    const precoTexto = modalPreco.textContent;
    const tamanho = document.getElementById('tamanho').value;
    const corSel = document.querySelector('.cor.selecionada');
    const cor = corSel ? (corSel.getAttribute('style').match(/background:(#[0-9a-fA-F]{3,6}|[a-zA-Z]+)/) || [null,'Não informada'])[1] : 'Não informada';
    const quantidade = Number(qtdInput.value || 1);
    const precoNum = parseFloat(precoTexto.replace(/[^\d,]/g, '').replace(',', '.')) / quantidade || 0;

    const idx = cart.findIndex(i => i.nome === nome && i.tamanho === tamanho && i.cor === cor);
    if (idx > -1) {
      cart[idx].quantidade = Number(cart[idx].quantidade) + quantidade;
    } else {
      // salvar imagem path para carrinho page (se quiser mostrar imagem)
      const imagem = modalImg.src || '';
      cart.push({ nome, tamanho, cor, quantidade, precoUnit: Number(precoNum.toFixed(2)), imagem });
    }
    salvarCarrinho();
    atualizarBadge();
    mostrarToast('Produto adicionado ao carrinho');
    // NÃO fecha o modal
  });

  // finalizar no modal: 1ª mostra campos, 2ª envia whatsapp
  if (btnFinalizar) {
    btnFinalizar.addEventListener('click', () => {
      if (btnFinalizar.dataset.revealed !== '1') {
        if (pagamentoDiv) pagamentoDiv.style.display = '';
        if (enderecoDiv) enderecoDiv.style.display = '';
        btnFinalizar.dataset.revealed = '1';
        btnFinalizar.textContent = 'Enviar pedido';
        return;
      }

      const nome = modalNome.textContent;
      const preco = modalPreco.textContent;
      const tamanho = document.getElementById('tamanho').value;
      const corSel = document.querySelector('.cor.selecionada');
      const cor = corSel ? (corSel.getAttribute('style').match(/background:(#[0-9a-fA-F]{3,6}|[a-zA-Z]+)/) || [null,'Não informada'])[1] : 'Não informada';
      const pagamento = document.getElementById('pagamento').value;
      const endereco = document.getElementById('endereco').value || 'Não informado';
      const quantidade = qtdInput.value || '1';

      const numero = '5581999999999'; // substitua pelo número real (DDI+telefone)

      // mensagem limpa, sem símbolos
      const mensagem = `Olá, tenho interesse neste produto da Maria Cruz Modas:%0A%0AProduto: ${nome}%0AQuantidade: ${quantidade}%0APreço: ${preco}%0ACor: ${cor}%0ATamanho: ${tamanho}%0AForma de pagamento: ${pagamento}%0AEndereço de entrega: ${endereco}%0A%0APor favor confirme a disponibilidade.`;

      const link = `https://wa.me/${numero}?text=${mensagem}`;
      window.open(link, '_blank');
      fecharModal();
    });
  }

  // inicial
  atualizarBadge();
  filtrarProdutos('todos', '');
});



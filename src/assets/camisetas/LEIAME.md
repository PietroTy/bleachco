# Fotos das camisetas no esqueleto 3D

Põe aqui, em PNG:

- `<id>-frente.png` — a camiseta vista de frente
- `<id>-costas.png` — a camiseta vista de costas (como a foto sai, sem espelhar)

`<id>` é o id do produto (`eclipse`, `spy`, ...). Um id novo também aparece no esqueleto da home.

Use os moldes `_molde-frente.png` / `_molde-costas.png` (1000×1164): põe a foto numa camada por baixo,
alinha a camiseta ao contorno (ponta de manga a ponta de manga, gola à barra) e exporta nesse tamanho.
Fundo transparente vira tecido preto. Só a frente? Tudo bem: as costas ficam lisas.

Depois: `./deploy.sh`. Se a camiseta 3D mudar, gere moldes novos com `python3 tools/make_molde.py`.

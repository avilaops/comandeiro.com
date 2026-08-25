"""
Gera o ícone adaptável (maskable) a partir do ícone quadrado da marca.

Por que existe um segundo arquivo em vez de reaproveitar o primeiro: um ícone
`maskable` é recortado pelo sistema na forma que o aparelho usa — círculo,
quadrado arredondado, gota. Só o que estiver dentro da "zona segura", um
círculo com 80% do lado, sobrevive ao recorte.

A arte da marca ocupa a folha quase inteira: mede 5,1% de margem nas laterais.
Declarada como maskable, o ponto laranja da direita e a barriga do C à esquerda
seriam cortados pela máscara redonda do Android. O ícone que existe está certo
como `any` — para maskable, a arte precisa encolher e ganhar respiro.

A conta: um retângulo só cabe num círculo se a DIAGONAL dele couber. Por isso a
escala sai da diagonal da arte contra o diâmetro da zona segura, e não da
largura — usar a largura deixaria os cantos para fora.

O fundo sai opaco e branco, o mesmo do ícone original: máscara sobre pixel
transparente vira canto furado, e trocar a cor aqui seria decidir marca, não
consertar geometria.

Uso:  python gerar-maskable.py <pasta-do-site>
"""

import sys
from pathlib import Path

from PIL import Image, ImageChops

# Zona segura do `maskable`: círculo com 80% do lado da folha.
ZONA_SEGURA = 0.80
FUNDO = (255, 255, 255)
TAMANHOS = (192, 512)


def caixa_do_desenho(im: Image.Image) -> tuple[int, int, int, int]:
    """Onde a arte começa e termina, ignorando o fundo chapado."""
    fundo = Image.new("RGB", im.size, FUNDO)
    mascara = ImageChops.difference(im.convert("RGB"), fundo).convert("L")
    caixa = mascara.point(lambda v: 255 if v > 12 else 0).getbbox()
    if caixa is None:
        raise SystemExit("a arte é indistinguível do fundo")
    return caixa


def gerar(origem: Path, lado: int) -> Image.Image:
    im = Image.open(origem).convert("RGBA")
    caixa = caixa_do_desenho(im)
    arte = im.crop(caixa)

    diagonal = (arte.width**2 + arte.height**2) ** 0.5
    escala = (lado * ZONA_SEGURA) / diagonal
    largura = max(1, round(arte.width * escala))
    altura = max(1, round(arte.height * escala))
    arte = arte.resize((largura, altura), Image.LANCZOS)

    folha = Image.new("RGBA", (lado, lado), (*FUNDO, 255))
    folha.paste(arte, ((lado - largura) // 2, (lado - altura) // 2), arte)
    return folha


def main() -> None:
    site = Path(sys.argv[1])
    origem = site / "web-app-manifest-512x512.png"
    if not origem.exists():
        raise SystemExit(f"não achei {origem}")

    for lado in TAMANHOS:
        destino = site / f"web-app-manifest-maskable-{lado}x{lado}.png"
        icone = gerar(origem, lado)
        icone.save(destino, "PNG", optimize=True)

        caixa = caixa_do_desenho(icone)
        margem = min(caixa[0], caixa[1], lado - caixa[2], lado - caixa[3])
        folga = 100 * margem / lado
        assert folga >= 10, f"{destino.name}: margem de {folga:.1f}% é pouca"
        print(f"  {destino.name}: margem {folga:.1f}% (mínimo 10%)")


if __name__ == "__main__":
    main()

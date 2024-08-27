# Editor de video em massa

## Descrição
Esse projeto tem objetivo de criar meu fluxo de trabalho com video
1. criar legenda
2. criar cortes verticais dos videos
3. inserir moldura

Isso foi criado com dica de IA pq meu objetivo é correr e não fazer codigo bonito.
Gostaria de tirar um evento que chama outro pra colocar lineamente mas fica pra depois.

### DONE

1. Criar legenda para videos horizontais

### DOING
1. Cortar videos e montar verical
2. Parametrizar cortes

### TO DO
3. Inserir Moldura
4. Parametrizar Moldura
5. Criar legenda para videos verticais com até 2 palavras
6. Ligar as etapas e permitir reiniciar cada uma delas sem gastar ser do zero onde se gasta creditos da OpenIA
7. Identificar o usuário para o trabalho sequencial, restringir o acesso será feito pelo site que hospedar.

### Observações

- Pode quebrar pq é tudo commit na master mesmo e como o item 6 ainda não foi feito preciso comentar etapas que desejo suprimir e fixar variaveis
HardCode para repetir o processo.

- Não funcionou no Windows use WSL pelo menos.

### Notas de comandos usados
```
ffmpeg -i input.mp4 -vf "scale=iw*min(1080/iw\,1350/ih):ih*min(1080/iw\,1350/ih),pad=1080:1350:(1080-iw*min(1080/iw\,1350/ih))/2:(1350-ih*min(1080/iw\,1350/ih))/2:0x662464ff" -c:a copy output.mp4

ffmpeg -i output.mp4 -i ret-bot1920.png -filter_complex "[0:v][1:v] overlay=(W-w)/2:(H-h)" -c:a copy output_with_border.mp4
ffmpeg -i output.mp4 -i ret-top1350.png -filter_complex "[0:v][1:v] overlay=(W-w)/2:0"     -c:a copy output_with_border.mp4

ffmpeg -i output_with_border.mp4 -vf "drawtext=fontfile='RubikDirt.ttf': \
text='TEXTO TEXTO': fontcolor=white: fontsize=120: \
x=(w-text_w)/2: y=h-(text_h)-50" -codec:a copy output-cuca.mp4

convert -size 1080x1350 xc:none \
     ret-top720.png -gravity north -geometry +0+0 -composite\
     ret-botton1920.png -gravity south -geometry +0+0 -composite \
    -font "RubikDirt.ttf" -pointsize 110 -fill white -gravity south \
    -annotate +0+45 "Cuca Jorge" \
 output.png

ffmpeg -i output.mp4 -i output.png \
  -filter_complex "[0:v][1:v] overlay=(W-w)/2:(H-h)/2" \
  -c:a copy output_with_border.mp4

ffmpeg -i input.mp4 -i output.png -filter_complex "\
[0:v]scale=iw*min(1080/iw\,1350/ih):ih*min(1080/iw\,1350/ih),pad=1080:1350:(1080-iw*min(1080/iw\,1350/ih))/2:(1350-ih*min(1080/iw\,1350/ih))/2:0x662464ff[bg]; \
[bg][1:v]overlay=(main_w-overlay_w)/2:(main_h-overlay_h)/2" \
-c:a copy output.mp4

```

### Resize
```
convert 1.png -resize 1080x 1-1080.png
```

### Corte no Topo
```
ffmpeg -i input.mp4 -vf "scale=1080:-1,crop=1080:1350:0:0" -c:a copy output_top.mp4
```

### Corte no Centro
```
ffmpeg -i input.mp4 -vf "scale=1080:-1,crop=1080:1350:0:(ih-1350)/2" -c:a copy output_center.mp4
```

### Corte no Inferior
```
ffmpeg -i input.mp4 -vf "scale=1080:-1,crop=1080:1350:0:ih-1350" -c:a copy output_bottom.mp4
```

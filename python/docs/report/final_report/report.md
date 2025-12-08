# 요약

# 1. 서론

## 1.1 연구 주제 소개

figure: manga_difficulty_colorization_example.png
- Manga 채색 작업을 하면 안 할 때보다 2~3배 시간이 늘어남
- 그 결과 많은 manga는 흑백으로 나옴
- AI가 채색하기에는 다음과 같은 어려움 존재
    - 캐릭터와 배경 구분
    - 한 캐릭터의 일관성 유지
    - 같은 배경과 분위기 유지
    - 같은 물체 일관성 유지
    - 칸 (Panel) 유지


figure: manga_difficulty_translation_example.png
- 번역 작업도 시간이 오래 걸림.
- 역본 작업: 텍스트를 번역
- 식질 작업: 번역된 텍스트를 그림으로
- AI가 번역하기에는 다음과 같은 어려움 존재
    - 그림 속 의성어, 의태어 유지
    - 배경이나 물체 속 텍스트 번역 일관성

## 1.2 연구의 중요성
해당 연구를 통해 manga 제작에 걸리는 시간은 줄이고 퀄리티는 더 높일 수 있으며 번역을 더 쉽게 해서 더 많은 언어에 대한 manga를 만들 수 있음

## 1.3 결과 요약

# 2. 관련 연구

## 2.1 MangaDiT
figure: manga_dit.png
Qiu et al. - 2025 - MangaDiT Reference-Guided Line Art Colorization with Hierarchical Attention in Diffusion Transforme.pdf 를 통해 간략한 소개 작성

figure: manga_dit_install_failed.png
- 직접 설치해보려 했으나 환경변수, conda env 버전이 꼬였지만 몇 시간 동안 계속 해봐도 해결 못해서 포기함

차별점
- MangaDiT는 reference가 필수적인데 Nano Manana는 없어도 좋은 품질 생성 가능
- line art 캐릭터 하나만 되는데 여러 panel을 입력해도 생성 가능

## 2.2 MangaNinja
figure: manga_ninja.png
Liu et al. - 2025 - MangaNinja Line Art Colorization with Precise Reference Following.pdf 를 통해 간략한 소개 작성

figure: manga_ninja_try1.png, manga_ninja_try2.png
- NVIDIA RTX 3070 8GB: 1장 inference 시 30분 소요
- 한 장 Reference 일관성 유지도 잘 안 됨. 
- 여러 Panel 입력시 뭉개짐.

차별점
- reference가 필수적인데 Nano Manana는 없어도 좋은 품질 생성 가능
- line art 캐릭터 하나만 되는데 여러 panel을 입력해도 생성 가능

## 2.2 Context-Informed Machine Translation of Manga using Multimodal Large Language Models
figure: manga_mllm.png
Lippmann et al. - 2025 - Context-Informed Machine Translation of Manga using Multimodal Large Language Models.pdf 를 통해 간략한 소개 작성

차별점
텍스트만 만드는게 아니라 이미지 자체를 수정해서 자연스럽게 만듦

# 3. 데이터
## 3.1. 데이터 수집 방법
- gallery-dl 을 통해 pixiv의 특정 게시물 페이지 다운로드 후 테스트로 사용
https://github.com/mikf/gallery-dl

## 3.2. 合コンに行ったら女がいなかった話
- 일본어
- 흑백 18쪽
figure: 136886858_p0.png
ref
蒼川なな (Aokawa Nana), 「合コンに行ったら女がいなかった話」
(How I Attended an All-Guy’s Mixer), pixiv, 2025. 
https://www.pixiv.net/en/artworks/136886858

## 3.3. 神は友達が少ない
- 일본어
- 컬러 표지 1쪽, 흑백 14쪽
figure: 107422372_p0.png
ref
ピノ/エス (Pino/Esu), 「神は友達が少ない」
(God Has Few Friends), pixiv, 2023 
https://www.pixiv.net/en/artworks/136886858

# 4. 연구 방법
## 4.1. Baseline
- gemini app에서 직접 손으로 manually 생성
https://gemini.google.com/app

- 페이지 한 장 만들고 그 다음 페이지 한 장씩 순차적으로 만듦
- 채색 일관성 유지를 위한 reference image는 이전에 만들어진 모든 colorized image를 전달함.

figure: baseline_translate_batch_structure.png, baseline_colorization_batch_structure.png

## 4.2. Nano Manana
### 4.2.1. Batch 구현

figure: nano_manana_translate_batch_structure.png, nano_manana_colorization_batch_structure.png

- translate는 `batch_size` 만큼을 한 번에 다 보내고 다 될 때까지 기다렸다가 다음 batch를 또 한 번에 보냄.
- colorization은 `min(batchNumber, batchSize, completedCount)` 만큼씩 reference를 보내고 그만큼 output image를 batch로 한 번에 만듦. `batchNumber`는 몇 번째 batch인지를 나타냄. `completedCount`는 현재 완료된 페이지의 개수를 의미함. 이때 처음으로 보낼 때는 `completedCount`가 0인데 예외적으로 1을 사용함.

### 4.2.2. Prompt
#### Translate
```
[Image]
page0

[Text]
Translate this manga page from Japanese to Korean. 

IMPORTANT TRANSLATION GUIDELINES:
- Do NOT translate literally word-by-word. Instead, think about the context, character emotions, and scene atmosphere.
- Adapt the translation to sound natural in Korean while preserving the original meaning and tone.
- Consider manga-specific expressions, onomatopoeia, and cultural nuances when translating.
- Make the dialogue flow naturally as if it was originally written in Korean.

IMAGE REQUIREMENTS:
- Maintain all characters, backgrounds, speech balloon shapes, panel grids, and manga structure.
- The original image size is 2129x3000 which is about 2129:3000. Make image which has EXACTLY SAME ratio and layout with original one.
- Translate speech balloon text, onomatopoeia, handwritten text, and all other texts that are not in Korean.
- Keep all visual elements unchanged except for the translated text.
```

#### Colorize
- 첫 장 보낼 때
```
[Text]
Colorize page 1:

[Image]
page0

[Text]
Colorize the manga page below. Refer to no reference images to maintain consistency in character eye color, skin color, hair color, and clothing color.

COLORING STYLE REQUIREMENTS:
- Apply vibrant, rich, and diverse colors throughout the entire image.
- Do NOT leave any area uncolored - fill every part with appropriate colors including backgrounds, objects, and small details.
- Use a colorful and visually appealing palette that brings the manga to life.
- Add depth and dimension with shading and highlights where appropriate.
- Make the coloring look professional and polished like a published color manga.

CONSISTENCY REQUIREMENTS:
- Maintain consistency for the same character, but if the character is wearing new clothing, draw them with appropriate different clothing.
- Maintain cosmetic features (eye color, hair color, skin tone) consistently for each character across all pages.
- Maintain consistency in background colors and object colors when they reappear.
- Color different characters with distinct colors, but the same character must be colored consistently.

IMAGE REQUIREMENTS:
- The original image size is 2129x3000 which is about 2129:3000. Make image which has EXACTLY SAME ratio and layout with original one.
- Preserve speech balloons, onomatopoeia, backgrounds, grids, and all structural elements.
- Do not modify or delete any text - keep all text exactly as is.
- Do not change character expressions or gestures - only apply colors.
- Color each panel's scene exactly as shown - do not add different scenes, modify scenes, or remove scenes.

Colorize the following image:
```


- 여러 reference 보낼 때: system prompt 앞부분 변경
```
[Text]
This is reference page 1 (already colorized):

[Image]
page1

[Text]
This is reference page 2 (already colorized):

[Image]
page2

[Text]
Colorize page 3:

[Image]
page3

[Text]
Colorize the manga page below. ...
```

#### Colorize and translate
- 첫 장 보낼 때
```
[Text]
Colorize and translate page 1:

[Image]
page0

[Text]
Colorize AND translate this manga page from Japanese to 한국어. Refer to no reference images to maintain color consistency.

COLORING REQUIREMENTS:
- Apply vibrant, rich, and diverse colors throughout the entire image.
- Use a colorful and visually appealing palette that brings the manga to life.
- Add depth and dimension with shading and highlights where appropriate.
- Make the coloring look professional and polished like a published color manga.

COLOR CONSISTENCY REQUIREMENTS:
- Maintain cosmetic features (eye color, hair color, skin tone) consistently for each character across all pages.
- Maintain consistency in background colors and object colors when they reappear.
- Color different characters with distinct colors, but the same character must be colored consistently.
- If a character is wearing new clothing, draw them with appropriate different clothing colors.

TRANSLATION REQUIREMENTS:
- Do NOT translate literally word-by-word. Think about context, character emotions, and scene atmosphere.
- Adapt the translation to sound natural in 한국어 while preserving the original meaning and tone.
- Consider manga-specific expressions, onomatopoeia, and cultural nuances when translating.
- Make the dialogue flow naturally as if it was originally written in 한국어.
- Translate speech balloon text, onomatopoeia, handwritten text, and all other texts.

IMAGE REQUIREMENTS:
- The original image size is 2129x3000 which is about 2129:3000. Make image which has EXACTLY SAME ratio and layout with original one.
- Preserve speech balloon shapes, panel grids, and all structural elements.
- Do NOT add completely new characters or objects that are not present in the original image. JUST COLORIZE EXISTING ELEMENTS.
- Color each panel's scene EXACTLY as shown - DO NOT ADD, MODIFY, OR REMOVE SCENES.

Colorize and translate the following image:
```


- 여러 reference 보낼 때: system prompt 앞부분 변경
```
[Text]
This is reference page 1 (already colorized and translated):

[Image]
page1

[Text]
This is reference page 2 (already colorized and translated):

[Image]
page2

[Text]
Colorize and translate page 3:

[Image]
page3

[Text]
Colorize AND translate this manga page from Japanese to 한국어. 
...
```

### 4.2.3. 이중 언어 표시
Prompt에 아래 내용 추가
```
BILINGUAL DISPLAY MODE:
- Display BOTH Japanese and English in the output image.
- Show the original English text at the TOP of each speech balloon.
- Show the translated English text at the BOTTOM of each speech balloon.
- Both languages should be clearly visible and readable.
- Adjust font sizes if necessary to fit both languages in the speech balloons.
```

figure: bilingual_translation.png

### 4.2.4. 더 나은 채색
figure: enhanced_colorization_comparison.png
```
COLORING REQUIREMENTS:
- Apply vibrant, rich, and diverse colors throughout the entire image.
- Use a colorful and visually appealing palette that brings the manga to life.
- Add depth and dimension with shading and highlights where appropriate.
- Make the coloring look professional and polished like a published color manga.
```
위 프롬프트 추가로 더 많은 그림자와 빛 효과가 개선됨

### 4.2.5. 웹사이트 배포
figure: nano_manana_og_image.png
figure: nano_manana_web_hero.png
nano_manana_web_working.png
https://nano-manana.vercel.app
해당 웹사이트에서 누구나 사용 가능

## 4.3. 시도했지만 실패한 방법들

### 4.3.1. Model sheet 생성
- 일관성 향상과 input token 수 절감을 위해 각 캐릭터의 전신 model을 항상 주면 되지 않을까?
- Model sheet는 각 캐릭터가 정자세로 전신을 보이고 있는 sheet (좀 더 설명)
- 여러 page를 넣고 전체 character가 나오는 sheet를 생성하도록 요청함.
- 이상적으로는 아래처럼 나오길 기대함.
figure: model_sheet_expected.png

```
Create a structured character model sheet based strictly on the provided black and white manga image. It is absolutely necessary that you only extract the specific characters and outfit designs actually present in the source photo; do not invent any new characters or create any new outfit variations not shown in the original image. The final output should be organized into exactly two distinct horizontal rows. In the very first top row, arrange a black and white model sheet displaying a single, clear full-body pose for each unique character found in the input, maintaining their original grayscale appearance. Directly in the row below this top row, place a corresponding colorized model sheet. This bottom row must mirror the top row perfectly, showing the exact same line-up of characters in the exact same poses, but now fully colored.
```
위 프롬프트 결과
figure: model_sheet_failed/ 내 ex1~ex6.png

- input 이미지에 너무 집중해서 model sheet라는 새로운 형태를 못 만듦
- 등장한 적 없는 캐릭터를 만들거나 있는 캐릭터를 파악 못함
- Specific part edit 만 잘하고 전체를 바꾸는 것은 어려움

### 4.3.2. Grid batch
- 일관성 향상과 input token 수 절감을 위해 여러 이미지를 하나의 이미지로 만들면 되지 않을까?

결과
figure: grid_batch_2x1.png, grid_batch_3x1.png, grid_batch_2x2.png, grid_batch_3x3.png

figure: grid_batch_low_consistency.png
2x1만 해도 캐릭터가 아예 바뀌거나 여러 캐릭터가 동일 복장을 하는 등 일관성이 매우 떨어짐.

figure: grid_batch_original_vs_1x1.png, grid_batch_2x1_vs_3x1.png, grid_batch_2x2_vs_3x3.png
grid를 키울 수록 blurry해지고 특히 2x2 이상부터는 얼굴 부분이 일그러져서 기괴해짐

### 4.3.3. Bbox identifier
- 일관성 향상을 위해 직접 각 캐릭터를 지시하는 박스를 그리면 되지 않을까?

```
Colorize this manga page. Maintain consistency of character. Maintain speech balloons and texts. Do not modify speech balloons and texts. Each character is highlighted by rectangular box with specific color. You can figure out each character with this box. Remove all the boxes in final result.
```
bbox를 없애라고 해도 안 없앰
figure: bbox_identifier_fail.png


# 5. 실험 결과
## 5.1. 처리 결과
Appendix A, B, C 참고.

## 5.2. Nano Manana의 한계
### 5.2.1. 완전히 새로운 스타일이 생성되는 문제
figure: pixiv1_original_vs_manana_ct_b5/p13.png
같은 장소와 내용이지만 완전히 다른 스타일의 인물이 그려짐.
신기한 점은 Korean으로 번역해달라 하면 한국 웹툰 스타일로 나오고 English로 번역해달라 하면 서양 Cartton 느낌으로 나옴.
전혀 새로운 스타일 만들지 말라고 강조해도 가끔 나옴.

## 5.2.2. 완전히 다른 장면이 생성되는 문제
figure: pixiv1_original_vs_manana_ct_b5/p13.png
장면도 완전히 다르고 번역된 텍스트를 보면 상황, 맥락도 완전히 다름.

## 5.2.3. 다른 비율로 생성되는 문제
figure: nano_manana_fail_different_aspect_ratio.png
Ratio aspect를 prompt에 명확하게 명시해도 완전히 다른 비율로 나올 때가 있음

이러한 문제가 나타나는 이유는 Nano banana pro model 자체의 문제임.

## 5.3. API 동작 비용
figure: nano_manana_api_token_chart.png

table: 아래 내용으로, 소수점 두자리까지 반올림해서 표시. price는 $
	Mean	Std	Sum
prompt_txt_token_cnt	207.563636	162.635323	22832.000000
prompt_img_token_cnt	602.781818	511.575232	66306.000000
thought_token_cnt	611.954545	348.878765	67315.000000
candidate_img_token_cnt	1120.000000	0.000000	123200.000000
total_token_cnt	2542.300000	836.150754	279653.000000
prompt_txt_token_price	0.000415	0.000325	0.045664
prompt_img_token_price	0.001206	0.001023	0.132612
thought_token_price	0.007343	0.004187	0.807780
candidate_img_token_price	0.134400	0.000000	14.784000
total_token_price	0.143364	0.004862	15.770056

전체 프로젝트 진행에 소모한 api 요청 수는 155회, api 비용은 33,372₩

## 5.4. 소스코드 통계
figure: git_contribution_stats.png
- 코드 추가 23,130줄
- 코드 삭제 2,740줄

# 6. 결론
대다수의 경우에서 colorization이 잘 되고
이중 언어 번역과 의성어, 의태어, 물체 번역도 가능
baseline보다 더 다채로운 색감 생성 가능
baseline보다 translation은 batch로 최대 10배 빨라질 수 있음. colorization은 최대 5배 빨라질 수 있음. reference 최대 개수가 5개라서.

하지만 높은 빈도로 원본에 없는 장면이 나오거나 일관성이 무너지는 경우가 존재함. 이를 해결하려 여러 시도를 했으나 nano banana pro 모델 자체의 특성이라 고치기 어려웠음.

당장의 해결책으로는 잘못된 page를 개별적으로 확인시켜서 accept해야 넘어가게 하고 이상하면 rerun 하는 기능으로 해결할 수 있어 보임.

# Reference

# Appendix A: Baseline 처리 결과
pixiv1_original_vs_nbp-base/ 내 p0.png~p17.png

# Appendix B: Nano Manana 일본어 -> 한국어 처리 결과
pixiv1_original_vs_manana_ct_b5/ 내 p0.png~p17.png
baseline보다 더 다채로운 색 표현을 한 것을 볼 수 있지만 아예 다른 장면이 들어가는 빈도가 더 잦아졌다.

# Appendix C: Nano Manana 일본어 -> 영어
pixiv2_original_vs_manana_ct_b5/ 내 p0.png~p15.png
캐릭터의 일관성은 굉장히 잘 유지되는데 그 이유는 genshin impact라는 게임 캐릭터가 인터넷에 널리 알려져 있어 학습이 많이 되어 그런 듯 하다.
# 画像を３枚重ねてマスクして幻想的な表現をする
https://yuki-sakaguchi.github.io/threejs-transition-effect/dist/

https://user-images.githubusercontent.com/16290220/196021923-c8663235-176e-4ce4-be07-844f65b99228.mov


## 考え方
画像は `PlaneGeometry` に転写する 
`PlaneGeometry` を3つ用意して並べる  
一番奥のやつ以外はマスクして（`alphaMap`にマスク画像を設定） `transparent` を `true` にして透けるようにする 
  
マスクの画像はThree.jsだと反転しているみたいなので、マスクして消したいところを黒、それ以外を白にすると良いらしい

アニメーションは three.js のアドオンで `EffectComposer` とかを使ってシェーダーを書いて、それを `gsap` でアニメーションさせた

## メモ
### マウスの位置を取得したりするのに `simple-input-events` というライブラリを使ってた  
ここら辺は自分で作ることが多かったので便利そう 

マウスの位置をオブジェクトに反映して動かす時にこんな感じにしていた  
`x` に `y` を、 `y` に `x`を当ててていい感じになっていた
```
this.group.rotation.x = this.mouse.y * 0.1;
this.group.rotation.y = this.mouse.x * 0.1;
```

さらにスムーズに滑らかなアニメーションにするために `lerp()` を挟んでいた 

```
this.mouseTarget.lerp(this.mouse, 0.05); // ベクトル間の補間係数、第二引数のパーセントでいい感じに補間してくれる
this.group.rotation.x = this.mouseTarget.y * 0.1;
this.group.rotation.y = this.mouseTarget.x * 0.1;
```

### three.jsのアドオンで表現する
`post-processing` というアドオンがあるらしい  
これを使えばリッチな表現が簡単にできるっぽい  
https://threejs.org/docs/#manual/en/introduction/How-to-use-post-processing

サンプルでは `three/addons/〜` となっているが、動画では `three/examples/〜` に書き換えてた  
おそらく `addons` を使うには `three-addons` みたいなライブラリを読み込むのが正攻法っぽい？  

```
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { GlitchPass } from 'three/examples/jsm/postprocessing/GlitchPass.js';
```

こんな感じで設定して
```
this.composer = new EffectComposer(this.renderer);

const renderPass = new RenderPass(this.scene, this.camera);
this.composer.addPass(renderPass)

const effectPass = new ShaderPass(CurtainShader);
this.composer.addPass(effectPass);
```

renderを `composer` にかえる

```
// this.renderer.render(this.scene, this.camera);
this.composer.render();
```

リサイズ時とかにサイズの調整もやる（こっちはrender側もやってる）

```
this.renderer.setSize(this.width, this.height);
this.composer.setSize(this.width, this.height);
```

### GLSLの参考にする時のめも
サンプル集からjsを辿ってソースを持ってくる  
https://threejs.org/examples/#webgl_postprocessing  
↓  
https://threejs.org/examples/jsm/shaders/DotScreenShader.js 

![スクリーンショット 2022-10-16 14 31 11](https://user-images.githubusercontent.com/16290220/196022000-2ee21253-e319-4ec1-9ad1-08b89cdc4eb8.png)

## 参考
- youtube
  - https://www.youtube.com/watch?v=12yVUxIkag0


## 作っててできたもの

https://user-images.githubusercontent.com/16290220/196022037-fd8b6434-dc28-4baf-8552-212ea2d33061.mov

https://user-images.githubusercontent.com/16290220/196022062-ad672d58-7027-4b85-bda2-3e7fb28ae244.mov

https://user-images.githubusercontent.com/16290220/196022078-8e18fab6-29a7-476e-a540-1a5a228f10cb.mov

https://user-images.githubusercontent.com/16290220/196022108-e3befd53-cc8e-430f-9cd6-3dfddd859192.mov

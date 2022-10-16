# 画像を３枚重ねてマスクして幻想的な表現をする


## 考え方
画像は `PlaneGeometry` に転写する 
`PlaneGeometry` を3つ用意して並べる  
一番奥のやつ以外はマスクして（`alphaMap`にマスク画像を設定） `transparent` を `true` にして透けるようにする 
  
マスクの画像はThree.jsだと反転しているみたいなので、マスクして消したいところを黒、それ以外を白にすると良いらしい

## メモ
マウスの位置を取得したりするのに `simple-input-events` というライブラリを使ってた  
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

## 参考
- youtube
  - https://www.youtube.com/watch?v=12yVUxIkag0
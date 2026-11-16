#!/usr/bin/env python3
"""Train VELTRIX's tiny character-level neural language model from scratch.
Usage: python -m pip install numpy; python brain/train.py brain/corpus.txt app/src/main/assets/veltrix_model.json
"""
import json, math, os, sys
import numpy as np

CONTEXT=8
EMBED=16
HIDDEN=64
STEPS=4000
LR=0.025

def main():
    if len(sys.argv)<3:
        print("Usage: python brain/train.py corpus.txt output_model.json"); raise SystemExit(2)
    text=open(sys.argv[1],encoding="utf-8").read()
    if len(text)<CONTEXT+20: raise SystemExit("Corpus is too small; provide at least a few paragraphs.")
    vocab=sorted(set(text))
    if len(vocab)>600: raise SystemExit("This starter model supports at most 600 distinct characters.")
    to_id={c:i for i,c in enumerate(vocab)}
    ids=np.array([to_id[c] for c in text],dtype=np.int64)
    rng=np.random.default_rng(42); V=len(vocab)
    E=rng.normal(0,0.08,(V,EMBED)); W1=rng.normal(0,0.06,(CONTEXT*EMBED,HIDDEN))
    b1=np.zeros(HIDDEN); W2=rng.normal(0,0.04,(HIDDEN,V)); b2=np.zeros(V)
    m=[np.zeros_like(x) for x in (E,W1,b1,W2,b2)]
    v=[np.zeros_like(x) for x in (E,W1,b1,W2,b2)]
    for step in range(1,STEPS+1):
        starts=rng.integers(CONTEXT,len(ids),size=64)
        X=np.stack([ids[s-CONTEXT:s] for s in starts])
        Y=ids[starts]
        emb=E[X].reshape(len(X),-1); h0=emb@W1+b1; h=np.tanh(h0); logits=h@W2+b2
        logits-=logits.max(axis=1,keepdims=True); probs=np.exp(logits); probs/=probs.sum(axis=1,keepdims=True)
        loss=-np.log(probs[np.arange(len(Y)),Y]+1e-12).mean()
        d=probs; d[np.arange(len(Y)),Y]-=1; d/=len(Y)
        gW2=h.T@d; gb2=d.sum(axis=0); dh=d@W2.T; dh0=dh*(1-h*h)
        gW1=emb.T@dh0; gb1=dh0.sum(axis=0); demb=(dh0@W1.T).reshape(len(X),CONTEXT,EMBED)
        gE=np.zeros_like(E)
        for j in range(CONTEXT): np.add.at(gE,X[:,j],demb[:,j,:])
        grads=[gE,gW1,gb1,gW2,gb2]
        params=[E,W1,b1,W2,b2]
        for i,(p,g) in enumerate(zip(params,grads)):
            m[i]=0.9*m[i]+0.1*g; v[i]=0.999*v[i]+0.001*(g*g)
            p-=LR*(m[i]/(1-0.9**step))/(np.sqrt(v[i]/(1-0.999**step))+1e-8)
        if step%500==0: print(f"step {step}/{STEPS} loss={loss:.3f}")
    model={"format":"veltrix-char-mlp-v1","context":CONTEXT,"embedding":EMBED,"hidden":HIDDEN,
      "vocab":vocab,"E":E.tolist(),"W1":W1.tolist(),"b1":b1.tolist(),"W2":W2.tolist(),"b2":b2.tolist()}
    os.makedirs(os.path.dirname(sys.argv[2]) or ".",exist_ok=True)
    with open(sys.argv[2],"w",encoding="utf-8") as f: json.dump(model,f,ensure_ascii=False,separators=(",",":"))
    print("Saved model:",sys.argv[2],"vocab:",V)

if __name__=="__main__": main()

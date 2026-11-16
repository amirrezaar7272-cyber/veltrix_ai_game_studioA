# VELTRIX Brain — from-scratch starter

This folder contains the first trainable neural language model for VELTRIX. It is a small character-level MLP, implemented directly with NumPy (no hosted AI API and no pretrained weights).

## Train on a computer

1. Install Python 3.10+ and NumPy: `python -m pip install numpy`
2. Create a UTF-8 corpus file containing text you have permission to use. Mix Persian and English if desired.
3. Train: `python brain/train.py brain/corpus.txt app/src/main/assets/veltrix_model.json`
4. Build the Android app. The app loads that model from assets and runs inference locally.

The starter network predicts the next character from the previous 8 characters. It is a real trainable neural network, but intentionally tiny: it is a learning prototype, not a ChatGPT-level assistant. Character-level generation can be repetitive and corpus quality strongly affects results.

## Device and computer

Training is intended for a computer. Inference runs on Android with no network access. The exported JSON model is the bridge between them. Keep the corpus rights-cleared and do not put private conversations or passwords in training data.

## Current limitations

- No cloud sync, remote training, retrieval index, or safety classifier yet.
- The model is not trained until you supply a corpus and run the training script.
- The model has a 600-character vocabulary limit and uses a small fixed context window.

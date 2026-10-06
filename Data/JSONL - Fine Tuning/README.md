# Qwen 3.5 9B Fine-Tuning with QLoRA

Fine-tuning pipeline for the Qwen 3.5 9B base model using QLoRA (Quantized Low-Rank Adaptation) on a criminal intelligence validation dataset.

## 📋 Overview

This repository contains a complete fine-tuning setup for training Qwen 3.5 9B to perform evidence-constrained criminal intelligence validation. The model learns to validate candidate intelligence claims against supplied evidence without inventing facts or treating allegations as established truth.

### Dataset

- **File**: `train.jsonl`
- **Examples**: 174 training samples
- **Format**: Chat format with system, user, and assistant messages
- **Task**: Evidence-based validation of criminal intelligence claims
- **Domain**: Criminal investigation, FIR analysis, entity resolution

### Model Architecture

- **Base Model**: Qwen 2.5 9B (Qwen/Qwen2.5-9B)
- **Fine-tuning Method**: QLoRA (4-bit quantization + LoRA adapters)
- **Trainable Parameters**: ~1% of total parameters
- **Memory Requirements**: ~10-12 GB GPU RAM (fits on T4)

## 🚀 Quick Start

### Option 1: Google Colab (Recommended)

1. **Upload the notebook** to Google Colab:
   ```
   Qwen3.5_9B_QLora_FineTuning.ipynb
   ```

2. **Set GPU runtime**:
   - Go to `Runtime` → `Change runtime type`
   - Select `T4 GPU` (free tier) or better
   - Click `Save`

3. **Run all cells**:
   - Click `Runtime` → `Run all`
   - Upload `train.jsonl` when prompted
   - Wait for training to complete (~30-60 minutes)

4. **Download your model**:
   - The notebook will generate a zip file
   - Download it or save to Google Drive

### Option 2: Local Training

#### Requirements

```bash
# Hardware
- GPU: 16GB+ VRAM (RTX 4090, A100, etc.)
- RAM: 32GB+ system memory
- Storage: 20GB+ free space

# Software
- Python 3.10+
- CUDA 11.8+ or 12.1+
- PyTorch 2.0+
```

#### Installation

```bash
# Clone or download this repository
cd "JSONL - Fine Tuning"

# Install dependencies
pip install transformers==4.48.0
pip install accelerate==1.2.1
pip install peft==0.14.0
pip install bitsandbytes==0.45.0
pip install trl==0.12.2
pip install datasets==3.2.0
pip install sentencepiece==0.2.0
```

#### Training

```python
# See the notebook for complete code
# Key steps:

# 1. Load dataset
train_data = load_jsonl('train.jsonl')

# 2. Configure 4-bit quantization
bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_compute_dtype=torch.bfloat16
)

# 3. Load model with LoRA
lora_config = LoraConfig(
    r=64,
    lora_alpha=128,
    target_modules=["q_proj", "k_proj", "v_proj", ...]
)

# 4. Train
trainer.train()

# 5. Save
model.save_pretrained("./qwen3.5-9b-qlora-finetuned")
```

## 📊 Training Configuration

### Hyperparameters

| Parameter | Value | Description |
|-----------|-------|-------------|
| **Epochs** | 3 | Number of training passes |
| **Batch Size** | 1 | Per-device batch size |
| **Gradient Accumulation** | 8 | Effective batch size = 8 |
| **Learning Rate** | 2e-4 | Initial learning rate |
| **Scheduler** | Cosine | Learning rate decay |
| **Warmup Ratio** | 0.05 | 5% warmup steps |
| **Max Sequence Length** | 2048 | Maximum token length |
| **Optimizer** | PagedAdamW 32-bit | Memory-efficient optimizer |

### LoRA Configuration

| Parameter | Value | Description |
|-----------|-------|-------------|
| **Rank (r)** | 64 | LoRA rank dimension |
| **Alpha** | 128 | LoRA scaling factor |
| **Dropout** | 0.05 | LoRA layer dropout |
| **Target Modules** | q_proj, k_proj, v_proj, o_proj, gate_proj, up_proj, down_proj | All attention and MLP layers |

### Quantization

- **Method**: 4-bit NF4 (Normal Float 4-bit)
- **Compute dtype**: bfloat16
- **Double quantization**: Enabled
- **Memory savings**: ~75% vs full precision

## 🎯 Model Performance

### Task: Evidence-Constrained Validation

The model validates criminal intelligence claims against evidence with these decision types:

1. **SUPPORTED** - Claim directly supported by evidence
2. **CORRECTED** - Claim supported after normalization (predicate/claim level adjustment)
3. **REJECTED** - Claim contradicted or semantically unsupported by evidence
4. **UNCERTAIN** - Insufficient evidence to validate

### Example Input

```json
{
  "task": "VALIDATE_CANDIDATE",
  "case_context": {"case_id": "RC-01/2023/NIA/DLI"},
  "evidence": [{
    "evidence_id": "EV-101",
    "text": "The pillion rider disclosed his identity as Md. Saddam..."
  }],
  "candidate": {
    "subject": {"name": "Md. Saddam"},
    "predicate": "POSSESSED",
    "object": {"name": "Cash Rs. 1040"},
    "claim_level": "FACT"
  }
}
```

### Example Output

```json
{
  "validation_id": "VAL-002",
  "decision": "SUPPORTED",
  "reason_code": "DIRECTLY_SUPPORTED",
  "validated_claim": {
    "subject_id": "ENT-001",
    "predicate": "POSSESSED",
    "object_id": "FIN-001",
    "claim_level": "FACT",
    "evidence_ids": ["EV-103"]
  },
  "evidence_ids": ["EV-103"]
}
```

## 📁 Repository Structure

```
JSONL - Fine Tuning/
├── train.jsonl                          # Training dataset (174 examples)
├── Qwen3.5_9B_QLora_FineTuning.ipynb   # Complete training notebook
├── README.md                            # This file
└── qwen3.5-9b-qlora-finetuned/         # Output directory (after training)
    ├── adapter_config.json              # LoRA adapter configuration
    ├── adapter_model.safetensors        # Trained LoRA weights
    ├── tokenizer_config.json            # Tokenizer configuration
    ├── tokenizer.json                   # Tokenizer vocabulary
    └── special_tokens_map.json          # Special token mappings
```

## 🔧 Inference

### Loading the Fine-Tuned Model

```python
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel
import torch

# Load base model
base_model = AutoModelForCausalLM.from_pretrained(
    "Qwen/Qwen2.5-9B",
    device_map="auto",
    torch_dtype=torch.bfloat16
)

# Load LoRA adapter
model = PeftModel.from_pretrained(
    base_model,
    "./qwen3.5-9b-qlora-finetuned"
)

# Load tokenizer
tokenizer = AutoTokenizer.from_pretrained(
    "./qwen3.5-9b-qlora-finetuned"
)
```

### Running Inference

```python
# Format your prompt
prompt = """<|im_start|>system
You are an evidence-constrained criminal intelligence validation model...<|im_end|>
<|im_start|>user
{your_validation_task_json}<|im_end|>
<|im_start|>assistant
"""

# Tokenize
inputs = tokenizer(prompt, return_tensors="pt").to(model.device)

# Generate
outputs = model.generate(
    **inputs,
    max_new_tokens=512,
    temperature=0.1,
    top_p=0.9,
    do_sample=True
)

# Decode
response = tokenizer.decode(outputs[0], skip_special_tokens=True)
print(response)
```

## 💡 Tips & Best Practices

### Memory Optimization

- **Use gradient checkpointing**: Trades compute for memory
- **Enable 4-bit quantization**: Reduces model size by 75%
- **Adjust batch size**: Start with 1, increase if GPU allows
- **Use gradient accumulation**: Simulate larger batches

### Improving Results

- **More epochs**: Try 5-10 epochs for better convergence
- **Learning rate tuning**: Try 1e-4 to 5e-4 range
- **Higher LoRA rank**: Increase r to 128 for more capacity
- **More data**: Collect additional training examples
- **Data quality**: Ensure consistent formatting and labeling

### Common Issues

**Out of Memory (OOM)**
- Reduce `per_device_train_batch_size` to 1
- Enable gradient checkpointing
- Reduce `max_seq_length` to 1024
- Use smaller LoRA rank (r=32)

**Slow Training**
- Enable `tf32` for faster computation
- Use `gradient_accumulation_steps` instead of large batches
- Reduce logging frequency
- Disable unnecessary callbacks

**Poor Performance**
- Check data format matches expected structure
- Verify chat template formatting
- Increase training epochs
- Adjust learning rate
- Add more diverse training examples

## 🔬 Technical Details

### Why QLoRA?

QLoRA combines two techniques for efficient fine-tuning:

1. **4-bit Quantization**: Compresses model weights to 4 bits
   - Reduces memory from ~18GB to ~5GB
   - Minimal accuracy loss (<1%)
   - Enables training on consumer GPUs

2. **LoRA (Low-Rank Adaptation)**: Trains small adapter matrices
   - Only ~60M parameters instead of 9B
   - Faster training and convergence
   - Easy to swap adapters for different tasks

### Chat Template

Qwen models use the ChatML format:

```
<|im_start|>system
{system_message}<|im_end|>
<|im_start|>user
{user_message}<|im_end|>
<|im_start|>assistant
{assistant_response}<|im_end|>
```

This format is automatically applied during data preprocessing.

## 📈 Monitoring Training

The notebook logs key metrics during training:

- **Loss**: Should decrease steadily
- **Learning rate**: Follows cosine schedule with warmup
- **Steps per second**: Training speed
- **GPU memory**: Monitor for OOM issues

View logs in the Colab output or check saved checkpoints.

## 🚢 Deployment Options

### Option 1: Direct Use with Transformers

```python
# Load and use as shown in Inference section
```

### Option 2: Merge and Deploy

```python
# Merge LoRA weights into base model
merged_model = model.merge_and_unload()
merged_model.save_pretrained("./merged-model")

# Deploy with vLLM, TGI, or Ollama
```

### Option 3: Quantize for Production

```python
# Further quantize merged model for faster inference
# Use GPTQ, AWQ, or GGUF formats
```

## 📝 Dataset Format

Each line in `train.jsonl` contains:

```json
{
  "messages": [
    {
      "role": "system",
      "content": "You are an evidence-constrained..."
    },
    {
      "role": "user",
      "content": {
        "task": "VALIDATE_CANDIDATE",
        "case_context": {...},
        "evidence": [...],
        "candidate": {...}
      }
    },
    {
      "role": "assistant",
      "content": "{\"validation_id\":\"...\", ...}"
    }
  ]
}
```

## 🤝 Contributing

To add more training data:

1. Follow the existing JSONL format
2. Ensure JSON validity
3. Include diverse validation scenarios
4. Maintain evidence-based reasoning
5. Append to `train.jsonl`

## 📄 License

This fine-tuning setup is provided as-is for educational and research purposes. Check Qwen model license for commercial use restrictions.

## 🔗 Resources

- **Qwen Model**: [Hugging Face - Qwen/Qwen2.5-9B](https://huggingface.co/Qwen/Qwen2.5-9B)
- **QLoRA Paper**: [arXiv:2305.14314](https://arxiv.org/abs/2305.14314)
- **PEFT Library**: [GitHub - huggingface/peft](https://github.com/huggingface/peft)
- **TRL Library**: [GitHub - huggingface/trl](https://github.com/huggingface/trl)

## 📧 Support

For issues or questions:
1. Check the notebook comments and markdown cells
2. Review this README's troubleshooting section
3. Verify your environment setup matches requirements
4. Check GPU memory availability

---

**Last Updated**: September 6, 2026  
**Model Version**: Qwen 2.5 9B  
**Training Method**: QLoRA (4-bit NF4 + LoRA r=64)  
**Dataset Size**: 174 examples

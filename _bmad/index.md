# BMAD Directory Index

## _config/

- **[agent-manifest.csv](./_config/agent-manifest.csv)** - Agent roster registry (empty)
- **[bmad-help.csv](./_config/bmad-help.csv)** - Skills and help utilities mapping
- **[files-manifest.csv](./_config/files-manifest.csv)** - File registry with hashes for tracking
- **[manifest.yaml](./_config/manifest.yaml)** - Installation record, version 6.2.2
- **[skill-manifest.csv](./_config/skill-manifest.csv)** - Skill manifest registry (empty)

### _config/ides/

- **[claude-code.yaml](./_config/ides/claude-code.yaml)** - Claude Code IDE configuration

---

## core/

- **[config.yaml](./core/config.yaml)** - User configuration: language and output settings
- **[module-help.csv](./core/module-help.csv)** - Module help cross-reference for skills

### core/bmad-advanced-elicitation/

- **[SKILL.md](./core/bmad-advanced-elicitation/SKILL.md)** - Interactive elicitation skill for content refinement
- **[methods.csv](./core/bmad-advanced-elicitation/methods.csv)** - Fifty elicitation techniques catalog

### core/bmad-brainstorming/

- **[SKILL.md](./core/bmad-brainstorming/SKILL.md)** - Brainstorming session facilitator interface
- **[brain-methods.csv](./core/bmad-brainstorming/brain-methods.csv)** - Sixty diverse brainstorming techniques
- **[template.md](./core/bmad-brainstorming/template.md)** - Output template for session results
- **[workflow.md](./core/bmad-brainstorming/workflow.md)** - Multi-step session orchestration workflow

### core/bmad-distillator/

- **[SKILL.md](./core/bmad-distillator/SKILL.md)** - Lossless document compression for LLM consumption
- **[agents/distillate-compressor.md](./core/bmad-distillator/agents/distillate-compressor.md)** - Subagent for dense information extraction
- **[agents/round-trip-reconstructor.md](./core/bmad-distillator/agents/round-trip-reconstructor.md)** - Subagent for distillate lossless validation
- **[resources/compression-rules.md](./core/bmad-distillator/resources/compression-rules.md)** - Rules for stripping prose, preserving info
- **[resources/distillate-format-reference.md](./core/bmad-distillator/resources/distillate-format-reference.md)** - Format examples and distillate reference
- **[resources/splitting-strategy.md](./core/bmad-distillator/resources/splitting-strategy.md)** - Semantic splitting strategy for large distillates

### core/bmad-editorial-review-prose/

- **[SKILL.md](./core/bmad-editorial-review-prose/SKILL.md)** - Copy-editing skill for prose issues

### core/bmad-editorial-review-structure/

- **[SKILL.md](./core/bmad-editorial-review-structure/SKILL.md)** - Structural editing for document organization

### core/bmad-help/

- **[SKILL.md](./core/bmad-help/SKILL.md)** - Navigation helper for BMAD workflow guidance

### core/bmad-index-docs/

- **[SKILL.md](./core/bmad-index-docs/SKILL.md)** - Document indexing for folder file discovery

### core/bmad-init/

- **[SKILL.md](./core/bmad-init/SKILL.md)** - Configuration initialization for project setup
- **[resources/core-module.yaml](./core/bmad-init/resources/core-module.yaml)** - Core module configuration questions

### core/bmad-party-mode/

- **[SKILL.md](./core/bmad-party-mode/SKILL.md)** - Multi-agent discussion orchestration interface
- **[workflow.md](./core/bmad-party-mode/workflow.md)** - Group discussion workflow orchestration

### core/bmad-review-adversarial-general/

- **[SKILL.md](./core/bmad-review-adversarial-general/SKILL.md)** - Cynical review skill for quality assurance

### core/bmad-review-edge-case-hunter/

- **[SKILL.md](./core/bmad-review-edge-case-hunter/SKILL.md)** - Path tracing for unhandled boundary conditions

### core/bmad-shard-doc/

- **[SKILL.md](./core/bmad-shard-doc/SKILL.md)** - Large document splitting by sections

#!/usr/bin/env node
/**
 * Avatar Video Generation Script
 *
 * This script generates avatar videos with voice narration for the demo.
 * It uses:
 * - ElevenLabs API for high-quality text-to-speech
 * - HeyGen API for realistic avatar video generation
 *
 * Prerequisites:
 * - ELEVENLABS_API_KEY environment variable
 * - HEYGEN_API_KEY environment variable
 *
 * Usage:
 * node scripts/generate-avatar-videos.mjs
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const HEYGEN_API_KEY = process.env.HEYGEN_API_KEY;

const OUTPUT_DIR = path.join(projectRoot, 'public', 'avatar');

async function ensureOutputDir() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  await fs.mkdir(path.join(OUTPUT_DIR, 'audio'), { recursive: true });
  await fs.mkdir(path.join(OUTPUT_DIR, 'video'), { recursive: true });
}

async function loadScript() {
  const scriptPath = path.join(projectRoot, 'public', 'demo-script.json');
  const content = await fs.readFile(scriptPath, 'utf-8');
  return JSON.parse(content);
}

async function generateElevenLabsAudio(text, sceneId, voiceConfig) {
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceConfig.voiceId}`, {
    method: 'POST',
    headers: {
      'Accept': 'audio/mpeg',
      'Content-Type': 'application/json',
      'xi-api-key': ELEVENLABS_API_KEY
    },
    body: JSON.stringify({
      text: text,
      model_id: voiceConfig.model,
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.0,
        use_speaker_boost: true
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
  }

  const audioBuffer = await response.arrayBuffer();
  const outputPath = path.join(OUTPUT_DIR, 'audio', `${sceneId}.mp3`);
  await fs.writeFile(outputPath, Buffer.from(audioBuffer));

  console.log(`  Audio generated: ${outputPath}`);
  return outputPath;
}

async function generateHeyGenVideo(audioPath, sceneId, avatarConfig) {
  // Step 1: Upload audio to HeyGen
  const audioData = await fs.readFile(audioPath);
  const audioBase64 = audioData.toString('base64');

  // Step 2: Create video generation task
  const createResponse = await fetch('https://api.heygen.com/v2/video/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': HEYGEN_API_KEY
    },
    body: JSON.stringify({
      video_inputs: [{
        character: {
          type: 'avatar',
          avatar_id: avatarConfig.avatarId,
          avatar_style: 'normal'
        },
        voice: {
          type: 'audio',
          audio_base64: audioBase64
        },
        background: {
          type: 'color',
          value: '#00000000'  // Transparent
        }
      }],
      dimension: {
        width: 512,
        height: 512
      },
      aspect_ratio: '1:1'
    })
  });

  if (!createResponse.ok) {
    const errorText = await createResponse.text();
    throw new Error(`HeyGen create error: ${createResponse.status} - ${errorText}`);
  }

  const createResult = await createResponse.json();
  const videoId = createResult.data.video_id;
  console.log(`  Video task created: ${videoId}`);

  // Step 3: Poll for completion
  let videoUrl = null;
  let attempts = 0;
  const maxAttempts = 60; // 5 minutes max wait

  while (!videoUrl && attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds

    const statusResponse = await fetch(`https://api.heygen.com/v1/video_status.get?video_id=${videoId}`, {
      headers: {
        'X-Api-Key': HEYGEN_API_KEY
      }
    });

    const statusResult = await statusResponse.json();

    if (statusResult.data.status === 'completed') {
      videoUrl = statusResult.data.video_url;
    } else if (statusResult.data.status === 'failed') {
      throw new Error(`HeyGen video generation failed: ${statusResult.data.error}`);
    }

    attempts++;
    process.stdout.write('.');
  }

  if (!videoUrl) {
    throw new Error('HeyGen video generation timed out');
  }

  // Step 4: Download video
  const videoResponse = await fetch(videoUrl);
  const videoBuffer = await videoResponse.arrayBuffer();
  const outputPath = path.join(OUTPUT_DIR, 'video', `${sceneId}.mp4`);
  await fs.writeFile(outputPath, Buffer.from(videoBuffer));

  console.log(`\n  Video generated: ${outputPath}`);
  return outputPath;
}

async function generateManifest(scenes, generatedFiles) {
  const manifest = {
    generated: new Date().toISOString(),
    scenes: scenes.map((scene, index) => ({
      id: scene.id,
      audio: generatedFiles[index]?.audio ? `/avatar/audio/${scene.id}.mp3` : null,
      video: generatedFiles[index]?.video ? `/avatar/video/${scene.id}.mp4` : null,
      durationMs: scene.durationMs,
      narration: scene.narration
    }))
  };

  const manifestPath = path.join(OUTPUT_DIR, 'manifest.json');
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`\nManifest saved: ${manifestPath}`);
}

async function main() {
  console.log('=== Avatar Video Generation ===\n');

  if (!ELEVENLABS_API_KEY) {
    console.error('ERROR: ELEVENLABS_API_KEY environment variable not set');
    console.log('\nTo set it:');
    console.log('  export ELEVENLABS_API_KEY="your-api-key"');
    console.log('\nGet your API key at: https://elevenlabs.io/');
    process.exit(1);
  }

  if (!HEYGEN_API_KEY) {
    console.error('ERROR: HEYGEN_API_KEY environment variable not set');
    console.log('\nTo set it:');
    console.log('  export HEYGEN_API_KEY="your-api-key"');
    console.log('\nGet your API key at: https://heygen.com/');
    process.exit(1);
  }

  await ensureOutputDir();
  const script = await loadScript();

  console.log(`Loaded script: ${script.title}`);
  console.log(`Total scenes: ${script.scenes.length}`);
  console.log(`Voice: ${script.voice.voiceName} (${script.voice.provider})`);
  console.log(`Avatar: ${script.avatar.avatarId} (${script.avatar.provider})\n`);

  const generatedFiles = [];

  for (const scene of script.scenes) {
    console.log(`\nProcessing scene: ${scene.id}`);
    console.log(`  Narration: "${scene.narration.substring(0, 50)}..."`);

    const generated = { audio: null, video: null };

    // Generate audio
    const audioPath = await generateElevenLabsAudio(
      scene.narration,
      scene.id,
      script.voice
    );
    generated.audio = audioPath;

    // Generate video with avatar
    const videoPath = await generateHeyGenVideo(
      audioPath,
      scene.id,
      script.avatar
    );
    generated.video = videoPath;

    generatedFiles.push(generated);
  }

  await generateManifest(script.scenes, generatedFiles);

  console.log('\n=== Generation Complete ===');
  console.log(`Audio files: ${generatedFiles.filter(f => f.audio).length}`);
  console.log(`Video files: ${generatedFiles.filter(f => f.video).length}`);
}

main().catch(error => {
  console.error('Generation failed:', error);
  process.exit(1);
});

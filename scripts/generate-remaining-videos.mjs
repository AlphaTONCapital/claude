#!/usr/bin/env node
/**
 * Generate remaining HeyGen videos (skips existing ones)
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const HEYGEN_API_KEY = process.env.HEYGEN_API_KEY;

const OUTPUT_DIR = path.join(projectRoot, 'public', 'avatar');

async function loadScript() {
  const scriptPath = path.join(projectRoot, 'public', 'demo-script.json');
  const content = await fs.readFile(scriptPath, 'utf-8');
  return JSON.parse(content);
}

async function uploadAudioToHeyGen(audioPath) {
  const audioData = await fs.readFile(audioPath);
  const uploadResponse = await fetch('https://upload.heygen.com/v1/asset', {
    method: 'POST',
    headers: {
      'X-Api-Key': HEYGEN_API_KEY,
      'Content-Type': 'audio/mpeg'
    },
    body: audioData
  });

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();
    throw new Error(`HeyGen upload error: ${uploadResponse.status} - ${errorText}`);
  }

  const uploadResult = await uploadResponse.json();
  return uploadResult.data.url || uploadResult.data.id;
}

async function generateHeyGenVideo(audioPath, sceneId, avatarConfig) {
  console.log('  Uploading audio to HeyGen...');
  const audioAsset = await uploadAudioToHeyGen(audioPath);
  console.log(`  Audio uploaded: ${audioAsset}`);

  const videoInput = {
    character: {
      type: 'avatar',
      avatar_id: avatarConfig.avatarId,
      avatar_style: 'normal'
    },
    voice: {
      type: 'audio',
      ...(audioAsset.startsWith('http')
        ? { audio_url: audioAsset }
        : { audio_asset_id: audioAsset })
    },
    background: {
      type: 'color',
      value: '#000000'
    }
  };

  const createResponse = await fetch('https://api.heygen.com/v2/video/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': HEYGEN_API_KEY
    },
    body: JSON.stringify({
      video_inputs: [videoInput],
      dimension: { width: 512, height: 512 },
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

  // Poll for completion (10 min max)
  let videoUrl = null;
  let attempts = 0;
  const maxAttempts = 120;

  while (!videoUrl && attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 5000));

    const statusResponse = await fetch(`https://api.heygen.com/v1/video_status.get?video_id=${videoId}`, {
      headers: { 'X-Api-Key': HEYGEN_API_KEY }
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

  const videoResponse = await fetch(videoUrl);
  const videoBuffer = await videoResponse.arrayBuffer();
  const outputPath = path.join(OUTPUT_DIR, 'video', `${sceneId}.mp4`);
  await fs.writeFile(outputPath, Buffer.from(videoBuffer));

  console.log(`\n  Video generated: ${outputPath}`);
  return outputPath;
}

async function updateManifest(script) {
  const manifest = {
    generated: new Date().toISOString(),
    scenes: await Promise.all(script.scenes.map(async (scene) => {
      const audioPath = path.join(OUTPUT_DIR, 'audio', `${scene.id}.mp3`);
      const videoPath = path.join(OUTPUT_DIR, 'video', `${scene.id}.mp4`);

      let hasAudio = false;
      let hasVideo = false;

      try { await fs.access(audioPath); hasAudio = true; } catch {}
      try { await fs.access(videoPath); hasVideo = true; } catch {}

      return {
        id: scene.id,
        audio: hasAudio ? `/avatar/audio/${scene.id}.mp3` : null,
        video: hasVideo ? `/avatar/video/${scene.id}.mp4` : null,
        durationMs: scene.durationMs,
        narration: scene.narration
      };
    }))
  };

  const manifestPath = path.join(OUTPUT_DIR, 'manifest.json');
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`\nManifest updated: ${manifestPath}`);
}

async function main() {
  console.log('=== Generate Remaining HeyGen Videos ===\n');

  if (!HEYGEN_API_KEY) {
    console.error('ERROR: HEYGEN_API_KEY not set');
    process.exit(1);
  }

  const script = await loadScript();

  for (const scene of script.scenes) {
    const videoPath = path.join(OUTPUT_DIR, 'video', `${scene.id}.mp4`);
    const audioPath = path.join(OUTPUT_DIR, 'audio', `${scene.id}.mp3`);

    // Check if video already exists
    try {
      await fs.access(videoPath);
      console.log(`Skipping ${scene.id} - video exists`);
      continue;
    } catch {}

    // Check if audio exists
    try {
      await fs.access(audioPath);
    } catch {
      console.log(`Skipping ${scene.id} - no audio file`);
      continue;
    }

    console.log(`\nGenerating video for: ${scene.id}`);
    try {
      await generateHeyGenVideo(audioPath, scene.id, script.avatar);
    } catch (err) {
      console.error(`  Failed: ${err.message}`);
      // Continue with next scene instead of failing completely
    }
  }

  await updateManifest(script);
  console.log('\n=== Done ===');
}

main().catch(console.error);

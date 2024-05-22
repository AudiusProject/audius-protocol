#!/bin/sh

if [ "$#" -ne 1 ]; then
    echo "Usage: $0 <audiofile>"
    exit 1
fi

file_path="$1"

# Compute the BPM using RhythmExtractor2013
bpm=$(essentia_streaming_extractor_music "$file_path" | grep 'bpm' | awk '{print $2}')

# Compute the key using KeyExtractor
key_output=$(essentia_streaming_extractor_music "$file_path" | grep 'tonic' | awk '{print $2}')
scale_output=$(essentia_streaming_extractor_music "$file_path" | grep 'scale' | awk '{print $2}')

echo "Key: $key_output, Scale: $scale_output, BPM: $bpm"


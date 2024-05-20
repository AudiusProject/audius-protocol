# analyze_audio.py
import sys
import essentia
import essentia.standard as es

def analyze_audio(file_path):
    loader = es.MonoLoader(filename=file_path)
    audio = loader()

    # Compute the BPM
    rhythm_extractor = es.RhythmExtractor2013(method="multifeature")
    bpm, _, _, _, _ = rhythm_extractor(audio)
    bpm = round(bpm)

    # Compute the key
    key_extractor = es.KeyExtractor()
    key, scale, strength = key_extractor(audio)

    return key, scale, bpm

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python analyze_audio.py <audiofile>")
        sys.exit(1)

    file_path = sys.argv[1]
    key, scale, bpm = analyze_audio(file_path)
    print(f"Key: {key}, Scale: {scale}, BPM: {bpm}")

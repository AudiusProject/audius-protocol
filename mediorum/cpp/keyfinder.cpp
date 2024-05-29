// keyfinder.cpp
#include <iostream>
#include <vector>
#include <keyfinder/keyfinder.h>
#include <sndfile.h>

// Convert KeyFinder key_t to string
std::string keyToString(KeyFinder::key_t key) {
    switch (key) {
        case KeyFinder::A_MAJOR: return "A major";
        case KeyFinder::A_MINOR: return "A minor";
        case KeyFinder::B_FLAT_MAJOR: return "B flat major";
        case KeyFinder::B_FLAT_MINOR: return "B flat minor";
        case KeyFinder::B_MAJOR: return "B major";
        case KeyFinder::B_MINOR: return "B minor";
        case KeyFinder::C_MAJOR: return "C major";
        case KeyFinder::C_MINOR: return "C minor";
        case KeyFinder::D_FLAT_MAJOR: return "D flat major";
        case KeyFinder::D_FLAT_MINOR: return "D flat minor";
        case KeyFinder::D_MAJOR: return "D major";
        case KeyFinder::D_MINOR: return "D minor";
        case KeyFinder::E_FLAT_MAJOR: return "E flat major";
        case KeyFinder::E_FLAT_MINOR: return "E flat minor";
        case KeyFinder::E_MAJOR: return "E major";
        case KeyFinder::E_MINOR: return "E minor";
        case KeyFinder::F_MAJOR: return "F major";
        case KeyFinder::F_MINOR: return "F minor";
        case KeyFinder::G_FLAT_MAJOR: return "G flat major";
        case KeyFinder::G_FLAT_MINOR: return "G flat minor";
        case KeyFinder::G_MAJOR: return "G major";
        case KeyFinder::G_MINOR: return "G minor";
        case KeyFinder::A_FLAT_MAJOR: return "A flat major";
        case KeyFinder::A_FLAT_MINOR: return "A flat minor";
        case KeyFinder::SILENCE: return "Silence";
        default: return "Unknown";
    }
}

int main(int argc, char* argv[]) {
    if (argc != 2) {
        std::cerr << "Usage: " << argv[0] << " <audio file path>" << std::endl;
        return 1;
    }

    const char* filePath = argv[1];

    // Open the audio file
    SF_INFO sfinfo;
    SNDFILE* sndfile = sf_open(filePath, SFM_READ, &sfinfo);
    if (!sndfile) {
        std::cerr << "Error opening audio file: " << sf_strerror(sndfile) << std::endl;
        return 1;
    }

    // Read the audio data
    std::vector<float> audioData(sfinfo.frames * sfinfo.channels);
    sf_readf_float(sndfile, audioData.data(), sfinfo.frames);
    sf_close(sndfile);

    // Initialize KeyFinder
    static KeyFinder::KeyFinder keyFinder;

    // Build an empty audio object
    KeyFinder::AudioData audioDataStruct;

    // Prepare the object for your audio stream
    audioDataStruct.setFrameRate(sfinfo.samplerate);
    audioDataStruct.setChannels(sfinfo.channels);
    audioDataStruct.addToSampleCount(sfinfo.frames * sfinfo.channels); // Total number of samples

    // Copy audio into the object
    for (size_t i = 0; i < audioData.size(); ++i) {
        audioDataStruct.setSample(i, audioData[i]);
    }

    // Run the analysis
    KeyFinder::key_t key = keyFinder.keyOfAudio(audioDataStruct);

    // Convert the key to a string
    std::string keyString = keyToString(key);

    // Output the result
    std::cout << keyString << std::endl;

    return 0;
}

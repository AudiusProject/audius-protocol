// bpm_analyzer.cpp
#include <aubio/aubio.h>
#include <iostream>
#include <string>
#include <vector>
#include <iomanip>

float analyze_bpm(const char* filename) {
    uint_t win_s = 1024;           // window size
    uint_t hop_s = win_s / 4;      // hop size
    unsigned int samplerate = 0;    // samplerate will be set by source

    // Create source buffer
    aubio_source_t* source = new_aubio_source(filename, samplerate, hop_s);
    if (!source) {
        std::cerr << "Error: could not open " << filename << std::endl;
        return 0;
    }

    // Get the actual samplerate from source
    samplerate = aubio_source_get_samplerate(source);

    // Create tempo detection object
    aubio_tempo_t* tempo = new_aubio_tempo("default", win_s, hop_s, samplerate);
    if (!tempo) {
        std::cerr << "Error: could not create tempo object" << std::endl;
        del_aubio_source(source);
        return 0;
    }

    // Temporary buffers
    fvec_t* in = new_fvec(hop_s);
    fvec_t* out = new_fvec(2);

    uint_t read = 0;
    std::vector<float> detected_bpms;

    // Analysis loop
    do {
        aubio_source_do(source, in, &read);
        aubio_tempo_do(tempo, in, out);
        
        if (out->data[0] != 0) {
            float current_bpm = aubio_tempo_get_bpm(tempo);
            if (current_bpm > 0) {
                detected_bpms.push_back(current_bpm);
            }
        }
    } while (read == hop_s);

    // Calculate final results
    float final_bpm = 0.0f;

    if (!detected_bpms.empty()) {
        // Calculate average BPM
        float sum = 0.0f;
        for (float bpm : detected_bpms) {
            sum += bpm;
        }
        final_bpm = sum / detected_bpms.size();
    }

    // Cleanup
    del_fvec(in);
    del_fvec(out);
    del_aubio_tempo(tempo);
    del_aubio_source(source);

    return final_bpm;
}

int main(int argc, char** argv) {
    if (argc != 2) {
        std::cerr << "Usage: " << argv[0] << " <filename>" << std::endl;
        return 1;
    }

    float bpm = analyze_bpm(argv[1]);
    
    if (bpm > 0) {
        std::cout << std::fixed << std::setprecision(3);
        std::cout << "BPM: " << bpm << std::endl;
        return 0;
    }

    return 1;
}

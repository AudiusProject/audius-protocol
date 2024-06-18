// bpm_analyzer.cpp
#include <iostream>
#include <essentia/algorithmfactory.h>
#include <essentia/essentia.h>
#include <essentia/pool.h>
#include <essentia/scheduler/network.h>
#include <essentia/streaming/streamingalgorithm.h>
#include <essentia/streaming/algorithms/poolstorage.h>

using namespace std;
using namespace essentia;
using namespace essentia::streaming;

int main(int argc, char* argv[]) {
    if (argc != 2) {
        cerr << "Usage: " << argv[0] << " <audio_file>" << endl;
        return 1;
    }

    string audioFilename = argv[1];

    essentia::init();

    AlgorithmFactory& factory = streaming::AlgorithmFactory::instance();

    auto audio = factory.create("MonoLoader", "filename", audioFilename, "sampleRate", 44100);
    auto rhythmExtractor = factory.create("RhythmExtractor2013");

    Pool pool;

    audio->output("audio") >> rhythmExtractor->input("signal");
    rhythmExtractor->output("bpm") >> PC(pool, "rhythm.bpm");
    rhythmExtractor->output("bpmIntervals") >> PC(pool, "rhythm.bpmIntervals");
    rhythmExtractor->output("ticks") >> PC(pool, "rhythm.ticks");
    rhythmExtractor->output("confidence") >> PC(pool, "rhythm.confidence");
    rhythmExtractor->output("estimates") >> PC(pool, "rhythm.estimates");

    scheduler::Network network(audio);
    network.run();

    cout << "BPM: " << pool.value<Real>("rhythm.bpm") << endl;
    cout << "Confidence: " << pool.value<Real>("rhythm.confidence") << endl;

    essentia::shutdown();

    return 0;
}

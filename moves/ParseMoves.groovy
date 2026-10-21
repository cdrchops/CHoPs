def endgamesFile = new File("endgames.txt").readLines()

def gameOutput = {pgn, fen ->
    def sb = new StringBuilder()
    sb << "\\newchessgame\n"
    sb << "\\variation{${pgn}}\\\\\n"
    sb << "\\fenboard{${fen}}\n"
    sb << "\\hidemoves{${pgn}}\n"
    sb << "\\cbstep\n\n"
    return sb
}
//
//endgamesFile.each {
//    \newchessgame
//    \variation{1. Rh7#}\\
//\fenboard{7k/R7/5N2/8/8/8/8/6K1  w q - 0 1}
//    \hidemoves{1. Rh7#}
//    \cbstep
//
//}

//println gameOutput("1. Rh7#", "7k/R7/5N2/8/8/8/8/6K1  w q - 0 1")

class Structure {
    def title
    def description
    def fen
    def pgn
}

def structures = []

def tmpStructure = new Structure()
endgamesFile.each {
    if (it.startsWith("TITLE")) {
        tmpStructure = new Structure()
        tmpStructure.title = it.substring("TITLE: ".size()).trim()
    } else if (it.startsWith("DESCRIPTION")) {
        tmpStructure.description = it.substring("DESCRIPTION:".size()).trim()
    } else if (it.startsWith("VARIATION")) {
        def tmpVariation = it.substring("VARIATION:".size()).split(",")
        tmpStructure.pgn = tmpVariation[0].trim()
        tmpStructure.fen = tmpVariation[1].trim()
//        println tmpVariation
    } else if (it.trim().size() == 0) {
        structures << tmpStructure
    }
}

structures.each {
    println "TITLE: ${it.title}"
    println "DESCRIPTION: ${it.description}"
    println gameOutput(it.pgn, it.fen)
}
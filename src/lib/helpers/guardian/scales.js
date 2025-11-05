import * as d3 from 'd3';

function getColourScale(scaleType, legendValues, legendColors) {
    let min = d3.min(legendValues);
    let max = d3.max(legendValues);
    let median = d3.median(legendValues);
    let mean = d3.mean(legendValues);

    if (scaleType === "threshold" || scaleType === "scaleThreshold") {
        return d3.scaleThreshold().domain(legendValues.slice(1, -1)).range(legendColors);
    }
    
    else if (scaleType === "ordinal" || scaleType === "scaleOrdinal") {
        return d3.scaleOrdinal().domain(legendValues).range(legendColors);
    }
    
    else if (scaleType === "linear median" || scaleType === "scaleLinearMedian") {
        return d3.scaleLinear().domain([min, median, max]).range(legendColors);
    }
    
    else if (scaleType === "linear mean" || scaleType === "scaleLinearMean") {
        return d3.scaleLinear().domain([min, mean, max]).range(legendColors);
    }
    
    else if (scaleType === "quantile" || scaleType === "scaleQuantile") {
        return d3.scaleQuantile().domain([min, max]).range(legendColors);
    }
    
    else if (scaleType === "quantize" || scaleType === "scaleQuantize") {
        return d3.scaleQuantize().domain([min, max]).range(legendColors);
    }

    else if (scaleType === "election") {
        var marginQuint = [6, 12, 18, 24];
        var colBlue = ['rgb(189,215,231)', 'rgb(107,174,214)', 'rgb(49,130,189)', 'rgb(8,81,156)'];
        var colRed = ['rgb(252,174,145)', 'rgb(251,106,74)', 'rgb(222,45,38)', 'rgb(165,15,21)'];
        var colPurple = ['rgb(203,201,226)', 'rgb(158,154,200)', 'rgb(117,107,177)', 'rgb(84,39,143)'];

        var scaleBlue = d3.scaleThreshold()
            .domain(marginQuint)
            .range(colBlue);

        var scaleRed = d3.scaleThreshold()
            .domain(marginQuint)
            .range(colRed);

        var scalePurple = d3.scaleThreshold()
            .domain(marginQuint)
            .range(colPurple);

        return function(margin, party) {
            if (party === "NAT" || party === "LIB" || party === "LNP") {
                return scaleBlue(margin);
            }
            else if (party === "ALP") {
                return scaleRed(margin);
            }
            else {
                return scalePurple(margin);
            }
        };
    }
    
    else if (scaleType === "swing") {
        let colBlue = ['rgb(189,215,231)', 'rgb(8,81,156)'];
        let colRed = ['rgb(252,174,145)', 'rgb(165,15,21)'];
        let scaleBlue = d3.scaleLinear().domain([0, 10]).range(colBlue);
        let scaleRed = d3.scaleLinear().domain([0, 10]).range(colRed);

        return function(swing, prediction) {
            return (swing < 0) ? scaleRed(Math.abs(swing)) : scaleBlue(swing);
        };
    }

    else {
        return d3.scaleLinear().domain([min, max]).range(legendColors);
    }
}

export { getColourScale };
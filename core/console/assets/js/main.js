export const chart = () => {
  const incomingData = JSON.parse(document.getElementById('chartData').textContent)
  console.log(typeof incomingData)
  console.log(incomingData)

  const margin = { top: 20, right: 30, bottom: 100, left: 80 }

  // Get the full width of the container dynamically
  const containerWidth = document.getElementById('chart').clientWidth
  const containerHeight = document.getElementById('chart').clientHeight
  const width = containerWidth - margin.left - margin.right
  const height = containerHeight - margin.top - margin.bottom

  // Create the SVG element
  const svg = d3.select("#chart")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`)

  // Create some sample data
  const data = incomingData

  // X and Y scales
  const x = d3.scaleBand()
    .domain(data.map(d => d.label))
    .range([0, width])
    .padding(0.2)

  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.value)])
    .nice()
    .range([height, 0])

  // Create X and Y axes
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).tickSize(0))
    .attr("class", "axis-label")
    .selectAll("text")
    .style("text-anchor", "end")
    .style("font-size", "16px")
    .attr("dx", "-0.8em")
    .attr("dy", "0.15em")
    .attr("transform", "rotate(-45)")

  svg.append("g")
    .call(d3.axisLeft(y))
    .attr("class", "axis-label")
    .selectAll("text")
    .style("font-size", "16px")

  // Create the bars
  svg.selectAll(".bar")
    .data(data)
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("x", d => x(d.label))
    .attr("y", d => y(d.value))
    .attr("width", x.bandwidth())
    .attr("height", d => height - y(d.value))
}

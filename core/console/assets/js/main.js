export const chart = () => {
  const margin = { top: 20, right: 30, bottom: 40, left: 40 }

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
  const data = Array.from({ length: 30 }, (_, i) => ({
    label: `Item ${i + 1}`,
    value: Math.floor(Math.random() * 100) + 1
  }))

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
  const xAxis = svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).tickSize(0))
    .attr("class", "axis-label")

  const yAxis = svg.append("g")
    .call(d3.axisLeft(y))
    .attr("class", "axis-label")

  // Create the bars
  const bars = svg.selectAll(".bar")
    .data(data)
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("x", d => x(d.label))
    .attr("y", d => y(d.value))
    .attr("width", x.bandwidth())
    .attr("height", d => height - y(d.value))

  // Zoom functionality
  const zoom = d3.zoom()
    .scaleExtent([1, 3]) // Limit zooming in/out
    .translateExtent([[0, 0], [width, height]]) // Limit translation
    .on("zoom", zoomed)

  // Apply zoom behavior to the SVG element
  svg.call(zoom)

  function zoomed(event) {
    // Rescale X-axis and bars
    const newX = event.transform.rescaleX(x)
    xAxis.call(d3.axisBottom(newX).tickSize(0))

    bars
      .attr("x", d => newX(d.label))
      .attr("width", newX.bandwidth())
  }
}

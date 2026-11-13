export function burstStars(parent) {
  const stars = document.createElement("span")
  stars.className = "mem-stars"
  stars.setAttribute("aria-hidden", "true")
  for (const mark of ["★", "✦", "★", "★", "✦"]) {
    const star = document.createElement("span")
    star.textContent = mark
    stars.append(star)
  }
  parent.append(stars)
  window.setTimeout(() => stars.remove(), 1000)
}

export function burstStarsAt(box) {
  const host = document.createElement("div")
  host.className = "star-host"
  host.style.left = `${box.left}px`
  host.style.top = `${box.top}px`
  host.style.width = `${box.width}px`
  host.style.height = `${box.height}px`
  document.body.append(host)
  burstStars(host)
  window.setTimeout(() => host.remove(), 1000)
}

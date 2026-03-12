function renderProducts(products) {

  const container = document.getElementById("product-list");
  container.innerHTML = "";

  products.forEach((p, index) => {

    const media = [];

    if (p.video) media.push({type:"video",src:p.video});

    if (p.gallery){
      p.gallery.forEach(img=>{
        media.push({type:"image",src:img});
      });
    }

    let current = 0;

    const card = document.createElement("div");
    card.className = "product-card";

    const mediaDiv = document.createElement("div");
    mediaDiv.className = "product-media";

    const display = document.createElement("div");

    function updateMedia(){

      display.innerHTML = "";

      const m = media[current];

      if(m.type === "video"){

        const vid = document.createElement("video");
        vid.src = m.src;
        vid.autoplay = true;
        vid.loop = true;
        vid.muted = true;

        display.appendChild(vid);

      }else{

        const img = document.createElement("img");
        img.src = m.src;

        display.appendChild(img);
      }
    }

    const left = document.createElement("button");
    left.className = "media-arrow arrow-left";
    left.innerHTML = "‹";

    const right = document.createElement("button");
    right.className = "media-arrow arrow-right";
    right.innerHTML = "›";

    left.onclick = () => {
      current = (current - 1 + media.length) % media.length;
      updateMedia();
    };

    right.onclick = () => {
      current = (current + 1) % media.length;
      updateMedia();
    };

    updateMedia();

    mediaDiv.appendChild(display);
    mediaDiv.appendChild(left);
    mediaDiv.appendChild(right);

    card.innerHTML += `
      <h3>${p.name}</h3>
      <p>${p.description}</p>
      <p><b>$${p.price}</b></p>
      <button onclick="addToCart(${index})">Add to cart</button>
    `;

    card.prepend(mediaDiv);

    container.appendChild(card);

  });
}

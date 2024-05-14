---
# Leave the homepage title empty to use the site title
title:
date: 2022-10-24
type: landing

sections:
  - block: about.biography
    id: about
    content:
      title: About
      # Choose a user profile to display (a folder name within `content/authors/`)
      username: admin
  - block: markdown
    id: research
    content:
      title: Research
      subtitle: ''
      text: |-
        <style>
          .custom-summary {
            font-size: 24px; /* Larger font size */
            color: white; /* Text color */
            background-color: #007BFF; /* Background color */
            padding: 10px 15px; /* Padding around the text */
            border-radius: 5px; /* Rounded corners */
            cursor: pointer; /* Cursor indicates clickable */
            border: none; /* No border */
            outline: none; /* No focus outline */
            box-shadow: 0 2px 5px rgba(0,0,0,0.2); /* Subtle shadow for depth */
            width: fit-content;
            margin-bottom: 10px; /* Space below the button */
          }
          .custom-summary:hover {
            background-color: #0056b3; /* Darker blue on hover */
          }
        </style>
        <details>
          <summary class="custom-summary">Using Naturalistic Stimuli to Probe the Cognitive and Neural Effects of Psychedelics:</summary>
          <div class="custom-details">
            <h2 id="psilocybin-movies">Movie Stimuli:</h2>
            <iframe width='400' height='315' src='https://www.youtube.com/embed/hSqfxILsKRk' frameborder='0' allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture' allowfullscreen></iframe>
          <iframe width='450' height='315' src='https://player.vimeo.com/video/124807425?h=69f52cad4d&title=0&byline=0&portrait=0' frameborder='0' allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture' allowfullscreen></iframe>
          <iframe width='400' height='315' src='https://www.youtube.com/embed/LIsDtHTklrE' frameborder='0' allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture' allowfullscreen></iframe>
          <iframe width='400' height='315' src='https://www.youtube.com/embed/NBVCIgfyciA' frameborder='0' allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture' allowfullscreen></iframe>
          <iframe width='400' height='315' src='https://www.youtube.com/embed/XrqSF2OOz_M' frameborder='0' allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture' allowfullscreen></iframe>
          <iframe width='400' height='315' src='https://player.vimeo.com/video/270992364?h=15b4603141' frameborder='0' allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture' allowfullscreen></iframe>
          <iframe width='400' height='315' src='https://www.youtube.com/embed/yHXLFk8p9WU' frameborder='0' allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture' allowfullscreen></iframe>
          <iframe width='400' height='315' src='https://www.youtube.com/embed/VSR88ULkxIY' frameborder='0' allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture' allowfullscreen></iframe>
          </div>
        <h2>Example recall data</h2>
        <p><a href="/recall/">Click Here to see Example Recall Data</a></p>
        </details>
        
  - block: collection
    id: featured
    content:
      title: Featured Publications
      filters:
        folders:
          - publication
        featured_only: true
    design:
      columns: '2'
      view: card
  - block: markdown
    id: posters
    content:
      title: Featured Posters
      subtitle: ''
      text: |-
        {{< gallery album="posters" >}}
  - block: markdown
    id: scicomm
    content:
      title: Science Communication
      subtitle: ''
      text: |-
        <div class='sk-ww-medium-publication-feed' data-embed-id='25410619'></div><script src='https://widgets.sociablekit.com/medium-publication-feed/widget.js' async defer></script>
  - block: markdown
    id: urbex
    content:
      title: Urban Exploration
      subtitle: ''
      text: |-
        <div data-behold-id="I0AEGufAbE4qLvH8mnzw"></div>
        <script>
          (() => {
            const d=document,s=d.createElement("script");s.type="module";
            s.src="https://w.behold.so/widget.js";d.head.append(s);
          })();
        </script>
  - block: contact
    id: contact
    content:
      title: Contact
      subtitle:
      text: |-
        If you want to reach me, check out all these options for doing that:
      # Contact (add or remove contact options as necessary)
      email: brian.winston@jhu.edu  
      phone: +1 (240) 997 5037
      contact_links:
        - icon: twitter
          icon_pack: fab
          name: DM Me
          link: 'https://twitter.com/winstonian3'
      # Automatically link email and phone or display as text?
      autolink: true
---

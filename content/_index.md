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
      text: |
        <div>
          <h2 id="psilocybin-movies">Movie stimuli used in psilocybin study:</h2>
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
  - block: collection
    id: SciComm
    content:
      title: SciComm
      subtitle: I cant figure out how to use this website
      text: ''
      # Choose how many pages you would like to display (0 = all pages)
      count: 1
      # Filter on criteria
      filters:
        folders:
          - post
        author: ""
        category: ""
        tag: ""
        exclude_featured: false
        exclude_future: false
        exclude_past: false
        publication_type: ""
      # Choose how many pages you would like to offset by
      offset: 0
      # Page order: descending (desc) or ascending (asc) date.
      order: desc
    design:
      # Choose a layout view
      view: compact
      columns: '2'
  - block: markdown
    id: Fun
    content:
      title: Fun
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

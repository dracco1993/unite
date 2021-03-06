fetch('/api/v1/games' + window.location.search)
  .then(function(response) {
    return response.json()
  })

  //Take the JSON object, and begin creating HTML elements
  .then(function(json) {
    var title = document.getElementById('game-title')
    title.innerHTML = json.title

    var body = document.querySelector('body')
    body.classList.add('game-background-' + json.id)

    json.teams.forEach(function(team){
      if (team.users.length > 0) {
        var boundingBox = document.createElement('div')
        boundingBox.classList.add('column', 'column-33')

        var teamTile = document.createElement('div')
        teamTile.classList.add('team-tile')

        var teamRow = document.createElement('div')
        teamRow.classList.add('row')

        var teamPlayerBox = document.createElement('div')
        teamPlayerBox.classList.add('column', 'column-80')

        var teamPlayerRow = document.createElement('div')
        teamPlayerRow.classList.add('row', 'team-players')

        // LOOP THROUGH EACH PLAYER FOR AVATARS
        team.users.forEach(function(user){
          var avatarBox = document.createElement('div')
          avatarBox.classList.add('column', 'column-20', 'popover-team-avatar')

          var avatar = document.createElement('img')
          if (user.avatar === null) {
            avatar.setAttribute('src', 'https://robohash.org/' + user.username)
          } else {
            avatar.setAttribute('src', 'https://discordapp.com/api/users/' + user.discord_id + '/avatars/' + user.avatar + '.jpg')
          }
          avatar.classList.add('team-avatar')

          var playerPopover = document.createElement('span')
          playerPopover.classList.add('popover')
          playerPopover.innerHTML = user.username_full

          avatarBox.appendChild(avatar)
          avatarBox.appendChild(playerPopover)

          teamPlayerRow.appendChild(avatarBox)
        })

        var teamSizeBox = document.createElement('div')
        teamSizeBox.classList.add('column', 'column-20')

        var teamSize = document.createElement('h5')
        teamSize.classList.add('team-size')
        teamSize.innerHTML = team.users.length + '/' + team.mode.size

        var seriousnessLabel = document.createElement('h5')
        seriousnessLabel.classList.add('team-label')
        seriousnessLabel.innerHTML = 'We are: '

        var seriousnessInput = document.createElement('span')
        seriousnessInput.classList.add('team-info')
        seriousnessInput.innerHTML = team.seriousness

        var infoRow = document.createElement('div')
        infoRow.classList.add('row')

        var infoBox = document.createElement('div')
        infoBox.classList.add('column', 'column-20', 'popover-team-description')

        var infoPopover = document.createElement('span')
        infoPopover.classList.add('popover')
        if (team.description === '') {
          infoPopover.classList.add('no-desc')
          team.description = 'No description provided.'
        }
        infoPopover.innerHTML = team.description


        fetch('/assets/images/info.svg')
          .then(function(response){
            response.text().then(function(svg){
              infoBox.innerHTML = svg
              infoBox.appendChild(infoPopover)
            })
          })

        var gameModeBox = document.createElement('div')
        gameModeBox.classList.add('column', 'column-40')

        var gameMode = document.createElement('h5')
        gameMode.classList.add('game-mode')
        gameMode.innerHTML = team.mode.name

        var joinBox = document.createElement('div')
        joinBox.classList.add('column')

        var joinLink = document.createElement('a')
        joinLink.classList.add('button', 'button-outline', 'join', 'float-right')
        joinLink.setAttribute('href', '/team?id=' + team.id)

        var joinText = document.createElement('span')
        joinText.innerHTML = 'JOIN'

        teamPlayerBox.appendChild(teamPlayerRow)
        teamSizeBox.appendChild(teamSize)

        teamRow.appendChild(teamPlayerBox)
        teamRow.appendChild(teamSizeBox)

        gameModeBox.appendChild(gameMode)

        joinLink.appendChild(joinText)
        joinBox.appendChild(joinLink)

        infoRow.appendChild(infoBox)
        infoRow.appendChild(gameModeBox)
        infoRow.appendChild(joinBox)

        seriousnessLabel.appendChild(seriousnessInput)

        teamTile.appendChild(teamRow)
        teamTile.appendChild(seriousnessLabel)
        teamTile.appendChild(infoRow)

        boundingBox.appendChild(teamTile)

        document.getElementById('teams').appendChild(boundingBox)
      }
    })

  // Dynamically create modal form
    var modalForm = document.createElement('form')
    modalForm.setAttribute('method', 'POST')
    modalForm.setAttribute('action', '/api/v1/teams')
    modalForm.setAttribute('id', 'team-form')
    modalForm.classList.add('modal-form', 'container')

    var modalFieldset = document.createElement('fieldset')

    var labelMode = document.createElement('label')
    labelMode.setAttribute('for', 'gameMode')
    labelMode.innerHTML = 'Choose your game mode:'

    var selectMode = document.createElement('select')
    selectMode.setAttribute('id', 'gameMode')
    selectMode.setAttribute('name', 'mode_id')

    json.modes.forEach(function(mode){
      var optionMode = document.createElement('option')
      optionMode.setAttribute('value', mode.id)
      optionMode.innerHTML = mode.name

      selectMode.appendChild(optionMode)
    })

    var labelSeriousness = document.createElement('label')
    labelSeriousness.setAttribute('for', 'gameSeriousness')
    labelSeriousness.innerHTML = 'How serious is your team?'

    var radiosBox = document.createElement('fieldset')
    radiosBox.setAttribute('id', 'radios')

    var input1 = document.createElement('input')
    input1.setAttribute('id', 'option1')
    input1.setAttribute('name', 'seriousness')
    input1.setAttribute('type', 'radio')
    input1.setAttribute('value', 'Casual')
    input1.classList.add('seriousness-input')

    var label1 = document.createElement('label')
    label1.setAttribute('for', 'option1')
    label1.innerHTML = 'Casual'

    var input2 = document.createElement('input')
    input2.setAttribute('id', 'option2')
    input2.setAttribute('name', 'seriousness')
    input2.setAttribute('type', 'radio')
    input2.setAttribute('value', 'Semi-Casual')
    input2.classList.add('seriousness-input')

    var label2 = document.createElement('label')
    label2.setAttribute('for', 'option2')
    label2.innerHTML = 'Semi-Casual'

    var input3 = document.createElement('input')
    input3.setAttribute('id', 'option3')
    input3.setAttribute('name', 'seriousness')
    input3.setAttribute('type', 'radio')
    input3.setAttribute('value', 'Neutral')
    input3.classList.add('seriousness-input')
    input3.checked = true

    var label3 = document.createElement('label')
    label3.setAttribute('for', 'option3')
    label3.innerHTML = 'Neutral'

    var input4 = document.createElement('input')
    input4.setAttribute('id', 'option4')
    input4.setAttribute('name', 'seriousness')
    input4.setAttribute('type', 'radio')
    input4.setAttribute('value', 'Semi-Hardcore')
    input4.classList.add('seriousness-input')

    var label4 = document.createElement('label')
    label4.setAttribute('for', 'option4')
    label4.innerHTML = 'Semi-Hardcore'

    var input5 = document.createElement('input')
    input5.setAttribute('id', 'option5')
    input5.setAttribute('name', 'seriousness')
    input5.setAttribute('type', 'radio')
    input5.setAttribute('value', 'Hardcore')
    input5.classList.add('seriousness-input')

    var label5 = document.createElement('label')
    label5.setAttribute('for', 'option5')
    label5.innerHTML = 'Hardcore'

    radiosBox.appendChild(input1)
    radiosBox.appendChild(label1)
    radiosBox.appendChild(input2)
    radiosBox.appendChild(label2)
    radiosBox.appendChild(input3)
    radiosBox.appendChild(label3)
    radiosBox.appendChild(input4)
    radiosBox.appendChild(label4)
    radiosBox.appendChild(input5)
    radiosBox.appendChild(label5)

    var labelDescription = document.createElement('label')
    labelDescription.setAttribute('for', 'teamDescription')
    labelDescription.innerHTML = 'Enter a description for your team:'

    var inputDescription = document.createElement('textarea')
    inputDescription.setAttribute('id', 'teamDescription')
    inputDescription.setAttribute('name', 'description')
    inputDescription.setAttribute('maxlength', '600')


    var submitButton = document.createElement('button')
    submitButton.setAttribute('form', 'team-form')
    submitButton.setAttribute('type', 'submit')
    submitButton.classList.add('button', 'float-right')
    submitButton.innerHTML = 'CREATE'

    var hiddenGameId = document.createElement('input')
    hiddenGameId.setAttribute('type', 'hidden')
    hiddenGameId.setAttribute('name', 'game_id')
    hiddenGameId.setAttribute('value', json.id)

    modalFieldset.appendChild(labelMode)
    modalFieldset.appendChild(selectMode)
    modalFieldset.appendChild(labelSeriousness)
    modalFieldset.appendChild(radiosBox)
    modalFieldset.appendChild(labelDescription)
    modalFieldset.appendChild(inputDescription)
    modalFieldset.appendChild(hiddenGameId)
    modalFieldset.appendChild(submitButton)

    modalForm.appendChild(modalFieldset)

    document.getElementById('grabMe').appendChild(modalForm)

    var grabMe = $('#grabMe')

    new jBox('Modal', {
        width: '50vw',
        height: '70vh',
        attach: $('.create-team'),
        title: 'Create a team for ' + json.title,
        content: grabMe,
        addClass: 'create-modal',
        onOpen: function() {
          grabMe.css('visibility', 'visible').css('height', '').css('overflow', '')
        }
    })

    $("#radios").radiosToSlider({
        animation: true
    })
  })

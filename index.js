class UserLayer extends Layer {
    constructor() {
        // Basis-Setup für den Layer (Titel, Icon, Standardbreite 500px)
        super("Beziehungen", "fas fa-users", 500);

        this.container = document.createElement("div");

        const userSnippet = this.render(`
            <fieldset style="height: 200px; overflow-y: auto; text-align: left;">
                <legend style="user-select: none;">Nutzersuche</legend>
                <input id="searchuserfield" class="textfield clatcher-width" type="text" placeholder="Username">
                <div class="table-wrapper">
                    <table id="usertable">
                    </table>
                </div>
            </fieldset>
        `);

        this.userField = userSnippet.querySelector("#searchuserfield");
        this.userTable = userSnippet.querySelector("#usertable");

        let debounce = null;
        this.userField.addEventListener("keyup", e => {
            clearTimeout(debounce);
            if(this.userField.value === "") {
                this.userTable.innerHTML = "";
                return;
            }

            const username = this.userField.value;
            
            debounce = setTimeout(() => {
                fetch(`/load/user?uname=${username}`, {
                    method: "GET"
                })
                .then(response => response.json())
                .then(data => {
                    if(data.code !== 200) {
                        new Toast(data.info).show();
                        return;
                    }

                    this.userTable.innerHTML = "";

                    for(let i = 0; i < data.info.length; ++i) {
                        const newLine = document.createElement("tr");

                        const avatarCell = document.createElement("td");
                        const img = document.createElement("img");
                        img.style.borderRadius = "50%";
                        img.width = 30;
                        img.height = 30;
                        img.src = (data.info[i].userlogo !== null) ? data.info[i].userlogo : "/pics/default.png";
                        avatarCell.appendChild(img);
                        newLine.appendChild(avatarCell);

                        const usernameCell = document.createElement("td");
                        const usernameLink = document.createElement("a");
                        usernameLink.href = "javascript:void(0)";
                        usernameLink.textContent = data.info[i].username;
                        usernameLink.addEventListener("click", () => {
                            fetch(`/load/userthread?uname=${data.info[i].username}`, {
                                method: "GET"
                            })
                            .then(response => response.json())
                            .then(data => {
                                options.privatethread.id = data.info.userid;
                                options.privatethread.username = data.info.username;
                                options.privatethread.header = data.info.userheader;
                                document.dispatchEvent(options.events.privateThreadChange);
                            });
                        });
                        usernameCell.appendChild(usernameLink);
                        newLine.appendChild(usernameCell);

                        const usersiteCell = document.createElement("td");
                        const usersiteLink = document.createElement("a");
                        usersiteLink.href = "javascript:void(0)";
                        usersiteLink.title = `Nutzerseite von ${data.info[i].username}`;
                        usersiteLink.innerHTML = '<i class="fa-solid fa-link"></i>';
                        usersiteLink.addEventListener("click", () => {
                            options.usersite.name = data.info[i].username;
                            document.dispatchEvent(options.events.loadUsersite);
                        });
                        usersiteCell.appendChild(usersiteLink);
                        newLine.appendChild(usersiteCell);

                        const requestCell = document.createElement("td");
                        const requestLink = document.createElement("a");
                        requestLink.href = "javascript:void(0)";
                        requestLink.title = `Freundschaftsanfrage an ${data.info[i].username}`;
                        requestLink.innerHTML = '<i class="fas fa-user-plus"></i>';
                        requestLink.addEventListener("click", () => {
                            fetch("/send/request", {
                                method: "PUT",
                                body: JSON.stringify({
                                    uid: data.info[i].userid
                                }),
                                headers: {
                                    "Content-Type": "application/json"
                                }
                            })
                            .then(response => response.json())
                            .then(data => {
                                new Toast(data.info).show();
                            });
                        });
                        requestCell.appendChild(requestLink);
                        newLine.appendChild(requestCell);

                        if(options.user.admin) {
                            const opCell = document.createElement("td");
                            const opLink = document.createElement("a");
                            opLink.href = "javascript:void(0)";
                            opLink.className = (data.info[i].userop === 1) ? "text-danger" : "text-success";
                            opLink.title = `Toggle OP-Rechte von ${data.info[i].username}`;
                            opLink.innerHTML = '<i class="fa-solid fa-circle"></i>';
                            opLink.addEventListener("click", () => {
                                fetch(`/toggle/op?uid=${data.info[i].userid}`, {
                                    method: "POST"
                                })
                                .then(response => response.json())
                                .then(data => {
                                    new Toast(data.info).show();
                                });
                            });
                            opCell.appendChild(opLink);
                            newLine.appendChild(opCell);

                            const adminCell = document.createElement("td");
                            const adminLink = document.createElement("a");
                            adminLink.href = "javascript:void(0)";
                            adminLink.className = (data.info[i].useradmin === 1) ? "text-danger" : "text-success";
                            adminLink.title = `Toggle Admin-Rechte von ${data.info[i].username}`;
                            adminLink.innerHTML = '<i class="fa-solid fa-crown"></i>';
                            adminLink.addEventListener("click", () => {
                                fetch(`/toggle/admin?uid=${data.info[i].userid}`, {
                                    method: "POST"
                                })
                                .then(response => response.json())
                                .then(data => {
                                    new Toast(data.info).show();
                                });
                            });
                            adminCell.appendChild(adminLink);
                            newLine.appendChild(adminCell);

                            const bannedCell = document.createElement("td");
                            const bannedLink = document.createElement("a");
                            bannedLink.href = "javascript:void(0)";
                            bannedLink.className = (data.info[i].userbanned === 1) ? "text-success" : "text-danger";
                            bannedLink.title = `Toggle Bann-Status von ${data.info[i].username}`;
                            bannedLink.innerHTML = '<i class="fa-solid fa-user"></i>';
                            bannedLink.addEventListener("click", () => {
                                fetch(`/toggle/ban?uid=${data.info[i].userid}`, {
                                    method: "POST"
                                })
                                .then(response => response.json())
                                .then(data => {
                                    new Toast(data.info).show();
                                });
                            });
                            bannedCell.appendChild(bannedLink);
                            newLine.appendChild(bannedCell);
                        }

                        this.userTable.appendChild(newLine);
                    }
                });
            }, 300);
        });

        this.container.appendChild(userSnippet);

        const friendSnippet = this.render(`
            <fieldset id="friends" style="height: 200px; overflow-y: auto; text-align: left;">
                <legend style="user-select: none;">Freunde</legend>
                <p>
                    <a id="update-friends" href="javascript:void(0)"><i class="fas fa-sync-alt"></i></a>
                </p>
                <p id="info"></p>
                <div class="table-wrapper">
                    <table id="friendstable">
                    </table>
                </div>
            </fieldset>
        `);

        this.friends = friendSnippet.querySelector("#friends");
        this.updateFriends = friendSnippet.querySelector("#update-friends");
        this.infoFriends = friendSnippet.querySelector("#info");
        this.friendsTable = friendSnippet.querySelector("#friendstable");
        this.fid = 0;

        this.updateFriends.addEventListener("click", () => {
            this.moreFriends && this.moreFriends.remove();
            this.fid = 0;
            this.loadFriends();
        });

        this.container.appendChild(friendSnippet);

        const requestSnippet = this.render(`
            <fieldset id="requests" style="height: 200px; overflow-y: auto; text-align: left;">
                <legend style="user-select: none">Anfragen</legend>
                <p>
                    <a id="update-requests" href="javascript:void(0)"><i class="fas fa-sync-alt"></i></a>
                </p>
                <p id="info"></p>
                <div class="table-wrapper">
                    <table id="requesttable">
                    </table>
                </div>
            </fieldset>
        `);

        this.requests = requestSnippet.querySelector("#requests");
        this.updateRequests = requestSnippet.querySelector("#update-requests");
        this.requestInfo = requestSnippet.querySelector("#info");
        this.tableRequests = requestSnippet.querySelector("#requesttable");
        this.rid = 0;

        this.updateRequests.addEventListener("click", () => {
            this.moreRequests && this.moreRequests.remove();
            this.rid = 0;
            this.loadRequests();
        });

        this.container.appendChild(requestSnippet);

        this.setBody(this.container);

        this.onStart = () => {
            this.loadFriends();
            this.loadRequests();
        };

        this.onClose = () => {
            this.fid = 0;
            this.rid = 0;
            this.userField.value = "";
            this.userTable.innerHTML = "";
            this.friendsTable.innerHTML = "";
            this.tableRequests.innerHTML = "";
            this.moreFriends && this.moreFriends.remove();
            this.moreRequests && this.moreRequests.remove();
        };
    }

    loadFriends() {
        if(options.user.id === 0) return;

        fetch(`/load/${options.user.id}/friends?fid=${this.fid}`, {
            method: "GET"
        })
        .then(response => response.json())
        .then(data => {
            if(data.info.length <= 0) {
                this.infoFriends.textContent = "Keine weiteren Freunde";
                return;
            }

            this.infoFriends.textContent = "";

            if(this.fid === 0) {
                this.friendsTable.innerHTML = "";
            }

            for(let i = 0; i < data.info.length; ++i) {
                const newLine = document.createElement("tr");

                const avatarCell = document.createElement("td");
                const avatarImg = document.createElement("img");
                avatarImg.style.borderRadius = "50%";
                avatarImg.width = 30;
                avatarImg.height = 30;
                avatarImg.alt = "Avatar";
                avatarImg.src = (data.info[i].userlogo !== null) ? data.info[i].userlogo : "/pics/default.png";
                avatarCell.appendChild(avatarImg);
                newLine.appendChild(avatarCell);

                const usernameCell = document.createElement("td");
                const usernameLink = document.createElement("a");
                usernameLink.href = "javascript:void(0)";
                usernameLink.textContent = data.info[i].username;
                usernameLink.addEventListener("click", () => {
                    fetch(`/load/userthread?uname=${data.info[i].username}`, {
                        method: "GET"
                    })
                    .then(response => response.json())
                    .then(data => {
                        options.privatethread.id = data.info.userid;
                        options.privatethread.username = data.info.username;
                        options.privatethread.header = data.info.userheader;
                        document.dispatchEvent(options.events.privateThreadChange);
                    });
                });
                usernameCell.appendChild(usernameLink);
                newLine.appendChild(usernameCell);

                const usersiteCell = document.createElement("td");
                const usersiteLink = document.createElement("a");
                usersiteLink.href = "javascript:void(0)";
                usersiteLink.title = `Usersite von ${data.info[i].username}`;
                usersiteLink.innerHTML = '<i class="fa-solid fa-link"></i>';
                usersiteLink.addEventListener("click", () => {
                    options.usersite.name = data.info[i].username;
                    document.dispatchEvent(options.events.loadUsersite);
                });
                usersiteCell.appendChild(usersiteLink);
                newLine.appendChild(usersiteCell);

                const removeCell = document.createElement("td");
                const removeLink = document.createElement("a");
                removeLink.className = "text-danger";
                removeLink.href = "javascript:void(0)";
                removeLink.title = `Lösche ${data.info[i].username} als Freund`;
                removeLink.innerHTML = '<i class="fas fa-user-times"></i>';
                removeLink.addEventListener("click", async () => {
                    if(!await new Confirm(`${data.info[i].username} wirklich als Freund löschen?`).show())
                        return;

                    fetch(`/${data.info[i].username}/removefriend`, {
                        method: "DELETE"
                    })
                    .then(response => response.json())
                    .then(data => {
                        new Toast(data.info).show();

                        if(data.code === 200) {
                            newLine.remove();
                        }
                    });
                });
                removeCell.appendChild(removeLink);
                newLine.appendChild(removeCell);

                this.friendsTable.appendChild(newLine);
            }

            this.moreFriends = document.createElement("p");
            const moreLink = document.createElement("a");
            moreLink.href = "javascript:void(0)";
            moreLink.textContent = "Mehr";
            moreLink.addEventListener("click", () => {
                this.loadFriends();
            });
            this.moreFriends.appendChild(moreLink);
            this.friends.appendChild(this.moreFriends);

            this.fid = data.info[data.info.length-1].userid;
        });
    }

    loadRequests() {
        if(options.user.id === 0) return;

        fetch(`/${this.rid}/requests`, {
            method: "GET"
        })
        .then(response => response.json())
        .then(data => {
            if(data.info.length <= 0) {
                this.requestInfo.textContent = "Keine weiteren Anfragen";
                return;
            }

            this.requestInfo.textContent = "";

            if(this.rid === 0) {
                this.tableRequests.innerHTML = "";
            }

            for(let i = 0; i < data.info.length; ++i) {
                const newLine = document.createElement("tr");

                const avatarCell = document.createElement("td");
                const avatarImg = document.createElement("img");
                avatarImg.style.borderRadius = "50%";
                avatarImg.width = 30;
                avatarImg.height = 30;
                avatarImg.alt = "Avatar";
                avatarImg.src = (data.info[i].userlogo !== null) ? data.info[i].userlogo : "/pics/default.png";
                avatarCell.appendChild(avatarImg);
                newLine.appendChild(avatarCell);

                const usernameCell = document.createElement("td");
                const usernameLink = document.createElement("a");
                usernameLink.href = "javascript:void(0)";
                usernameLink.textContent = data.info[i].username;
                usernameLink.addEventListener("click", () => {
                    fetch(`/load/userthread?uname=${data.info[i].username}`, {
                        method: "GET"
                    })
                    .then(response => response.json())
                    .then(data => {
                        options.privatethread.id = data.info.userid;
                        options.privatethread.username = data.info.username;
                        options.privatethread.header = data.info.userheader;
                        document.dispatchEvent(options.events.privateThreadChange);
                    });
                });
                usernameCell.appendChild(usernameLink);
                newLine.appendChild(usernameCell);

                const usersiteCell = document.createElement("td");
                const usersiteLink = document.createElement("a");
                usersiteLink.href = "javascript:void(0)";
                usersiteLink.title = `Nutzerseite von ${data.info[i].username}`;
                usersiteLink.innerHTML = '<i class="fa-solid fa-link"></i>';
                usersiteLink.addEventListener("click", () => {
                    options.usersite.name = data.info[i].username;
                    document.dispatchEvent(options.events.loadUsersite);
                });
                usersiteCell.appendChild(usersiteLink);
                newLine.appendChild(usersiteCell);

                const acceptCell = document.createElement("td");
                const acceptLink = document.createElement("a");
                acceptLink.href = "javascript:void(0)";
                acceptLink.title = `Akzeptiere Anfrage von ${data.info[i].username}`;
                acceptLink.innerHTML = '<i class="fas fa-check"></i>';
                acceptLink.addEventListener("click", () => {
                    fetch("/accept/request", {
                        method: "PUT",
                        body: JSON.stringify({
                            uid: data.info[i].userid
                        }),
                        headers: {
                            "Content-Type": "application/json"
                        }
                    })
                    .then(response => response.json())
                    .then(data => {
                        new Toast(data.info).show();

                        newLine.remove();
                    });
                });
                acceptCell.appendChild(acceptLink);
                newLine.appendChild(acceptCell);

                const refuseCell = document.createElement("td");
                const refuseLink = document.createElement("a");
                refuseLink.href = "javascript:void(0)";
                refuseLink.title = `Lehne Anfrage von ${data.info[i].username} ab`;
                refuseLink.innerHTML = '<i class="fas fa-ban"></i>';
                refuseLink.addEventListener("click", () => {
                    fetch("/refuse/request", {
                        method: "PUT",
                        body: JSON.stringify({
                            uid: data.info[i].userid
                        }),
                        headers: {
                            "Content-Type": "application/json"
                        }
                    })
                    .then(response => response.json())
                    .then(data => {
                        new Toast(data.info).show();

                        newLine.remove();
                    });
                });
                refuseCell.appendChild(refuseLink);
                newLine.appendChild(refuseCell);

                this.tableRequests.appendChild(newLine);            
            }

            this.moreRequests = document.createElement("p");
            const moreLink = document.createElement("a");
            moreLink.href = "javascript:void(0)";
            moreLink.textContent = "Mehr";
            moreLink.addEventListener("click", () => {
                this.loadRequests();
            });
            this.moreRequests.appendChild(moreLink);
            this.requests.appendChild(this.moreRequests);

            this.rid = data.info[data.info.length-1].userid;
        });
    }
}

manager.registerLayer({
    layer: new UserLayer(),
    where: options.layerVisibility.onlogin,
	type: options.layerType.system
});
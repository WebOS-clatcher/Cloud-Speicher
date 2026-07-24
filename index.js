class ShareDialog extends Dialog {
    constructor(sid) {
        super("Datei teilen");

        this.sid = sid;
        this.container = document.createElement("div");

        this.setBody(this.container);

        this.load(0);
    }

    async load(fid) {
        const response = await fetch(`/load/${options.user.id}/friends?fid=${fid}`);
        const data = await response.json();
        
        for(let i = 0; i < data.info.length; ++i) {
            const button = document.createElement("button");
            button.className = "clatcher-btn mt-5 mb-5";
            button.style.marginLeft = "auto";
            button.style.marginRight = "auto";
            button.style.display = "flex";
            button.style.justifyContent = "center";
            button.style.alignItems = "center";
            button.addEventListener("click", () => {
                fetch(`/share/${this.sid}?uid=${data.info[i].userid}`, {
                    method: "PUT"
                })
                .then(response => response.json())
                .then(data => {
                    new Toast(data.info).show();
                });
            });

            const img = document.createElement("img");
            img.style.borderRadius = "50%";
            img.classList.add("mr-15");
            img.src = data.info[i].userlogo === null ? "/pics/default.png" : data.info[i].userlogo;
            img.height = 30;
            img.width = 30;

            button.appendChild(img);
            button.appendChild(document.createTextNode(data.info[i].username));

            this.container.appendChild(button);
        }
    }
}

class Storage extends Layer {
    constructor() {
        super("Speicher", "fas fa-archive", 550);

        this.files = [];

        this.container = this.render(`
                    <form id="storage" class="mt-15 input-group">
                        <label class="clatcher-btn">
                            <i class="far fa-file-archive"></i> Datei wählen
                            <input class="invisible" type="file" id="storagefile">
                        </label>
                        <input class="clatcher-btn" type="submit" name="upload" value="Speichern">
                    </form>
            
                    <div class="mt-15 input-group">
                        <input id="filter" class="textfield mt-5" type="text" name="filter" placeholder="Filter">
                        <button class="clatcher-btn mt-5" id="load-files"><i class="fas fa-cloud-download-alt"></i></button>
                        <button class="clatcher-btn mt-5" id="hide-files"><i class="fas fa-eye-slash"></i></button>
                    </div>
            
                    <div style="max-height: 500px;" class="table-wrapper mt-15">
                        <table id="files"></table>
                    </div>`
        );
        
        this.container.classList.add("mt-n15");
        this.container.classList.add("mr-n15");
        this.container.classList.add("ml-n15");

        this.storage = this.container.querySelector("#storage");
        this.storageFile = this.container.querySelector("#storagefile");
        this.filter = this.container.querySelector("#filter");
        this.fileLoad = this.container.querySelector("#load-files");
        this.fileHide = this.container.querySelector("#hide-files");
        this.fileTable = this.container.querySelector("#files");

        this.storage.addEventListener("submit", e => {
            e.preventDefault();
            this.uploadYourFile();
        });

        this.fileLoad.addEventListener("click", () => {
            this.loadFiles();
        });

        this.fileHide.addEventListener("click", () => {
            this.hideFiles();
        });

        this.filter.addEventListener("keyup", e => {
            if(e.keyCode < 33 || e.keyCode > 126) return;
            this.showFiles();
        });

        this.setBody(this.container);

        this.onClose = () => {
            this.removeCurrentFile();
            this.fileTable.innerHTML = "";
            this.filter.value = "";
        };
    }

    uploadYourFile() {

        if(this.storageFile.value === "") {
            new Toast("Keine Datei ausgewählt").show();
            return;
        }

        const file = this.storageFile.files[0];

        if(file.size > options.constants.MAX_STORAGE_FILESIZE) {
            new Toast(`Maximal ${options.constants.MAX_STORAGE_FILESIZE / (1024*1024)} MB`).show();

            this.storageFile.value = "";
            this.storage.upload.value = "Speichern";
            return;
        }

        const fd = new FormData();
        fd.append("ufile", file);

		this.storage.upload.disabled = true;
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/file/upload");

        xhr.upload.addEventListener("progress", evt => {
            if(evt.lengthComputable) {
                this.storage.upload.value = `${Math.round((evt.loaded / evt.total) * 100)}%`;
            }
        });

        xhr.onload = () => {
            const response = JSON.parse(xhr.responseText);
            if(response.code === 200) {
                new Toast(response.info).show();
            }
        };

        xhr.onerror = () => {
            new Toast("Upload fehlgeschlagen").show();
        }

		xhr.onloadend = () => {
			this.storageFile.value = "";
			this.storage.upload.value = "Speichern";
			this.storage.upload.disabled = false;
		};

        xhr.send(fd);
    }

    hideFiles() {
        this.files = [];
        this.fileTable.innerHTML = "";
    }

    removeCurrentFile() {
        (this.container.firstElementChild.id !== "storage") && this.container.firstElementChild.remove();
        this.fm && this.fm.clear();
    }

    showFile(name, sid) {
        this.removeCurrentFile();
        new Toast(`${name} wird geladen...`).show();
        this.fm = new FileManager(sid, name);
        const file = this.fm.render();
        (file instanceof Promise) ? file.then(data => { this.container.prepend(data)}) : this.container.prepend(file);
    }

    showFiles() {
        const table = this.fileTable;
        table.innerHTML = "";
        for(let i = 0; i < this.files.length; ++i) {
            if(this.filter.value !== "" && !this.files[i].filename.toLowerCase().includes(this.filter.value.toLowerCase()))
                continue;
            const row = document.createElement("tr");
            const fileCell = document.createElement("td");
            const fileLink = document.createElement("a");
            fileLink.href = "javascript:void(0)";
            fileLink.addEventListener("click", () => {
                this.showFile(this.files[i].filename, this.files[i].sid);
            });
            fileLink.textContent = this.files[i].filename;
            fileCell.appendChild(fileLink);
            row.appendChild(fileCell);

            const shareCell = document.createElement("td");
            const shareBtn = document.createElement("button");
            shareBtn.classList.add("clatcher-btn");
            shareBtn.innerHTML = '<i class="fa fa-share-alt"></i>';
            shareBtn.addEventListener("click", () => {
                new ShareDialog(this.files[i].sid).show();
            });
            shareCell.appendChild(shareBtn);
            row.appendChild(shareCell);

            const removeCell = document.createElement("td");
            const removeBtn = document.createElement("button");
            removeBtn.classList.add("clatcher-btn");
            removeBtn.addEventListener("click", () => {
                this.removeFile(this.files[i].sid);
            });
            removeBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
            removeCell.appendChild(removeBtn);
            row.appendChild(removeCell);
            table.appendChild(row);
        }        
    }

    async removeFile(sid) {
        if(!await new Confirm("Wirklich löschen?").show())
            return;

        fetch("/remove/file", {
            method: "DELETE",
            body: JSON.stringify({
                sid: sid
            }),
            headers: {
                "Content-Type": "application/json"
            }
        })
        .then(response => response.json())
        .then(data => {
            new Toast(data.info).show();
        });
    }

    loadFiles() {
        fetch("/user/files", {
            method: "GET"
        })
        .then(response => response.json())
        .then(data => {
            this.files = data.info;
            this.showFiles();
        });
    }
}

manager.registerLayer({
    layer: new Storage(),
    where: options.layerVisibility.onlogin,
	type: options.layerType.app
});